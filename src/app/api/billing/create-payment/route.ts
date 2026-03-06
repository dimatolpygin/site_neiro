import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createPayment } from '@/lib/yookassa';
import { checkRateLimit } from '@/lib/utils/rateLimit';
import type { PricingPlan, Transaction } from '@/types/database';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const schema = z.object({
  planId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const rateKey = `ratelimit:payment:${user.id}`;
  const rateResult = await checkRateLimit(rateKey, 3, 300);
  if (!rateResult.allowed) {
    return NextResponse.json({ error: 'Too many payment requests' }, { status: 429 });
  }

  const admin = createServiceClient();

  const { data: planData } = await admin
    .from('pricing_plans')
    .select('*')
    .eq('id', parsed.data.planId)
    .eq('is_active', true)
    .single();

  const plan = planData as PricingPlan | null;

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  const totalKopecks = plan.topup_kopecks + plan.bonus_kopecks;
  const idempotencyKey = randomUUID();

  const { data: txData, error: txError } = await admin
    .from('transactions')
    .insert({
      user_id: user.id,
      type: 'topup',
      status: 'pending',
      amount_kopecks: totalKopecks,
      balance_before: 0,
      balance_after: 0,
      description: `Пополнение "${plan.name}"`,
    } as never)
    .select()
    .single();

  if (txError || !txData) {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }

  const transaction = txData as Transaction;

  try {
    const payment = await createPayment({
      amountKopecks: plan.topup_kopecks,
      description: `AI Generator: пополнение баланса "${plan.name}"`,
      returnUrl: process.env.YOOKASSA_RETURN_URL!,
      metadata: {
        userId: user.id,
        transactionId: transaction.id,
      },
      idempotencyKey,
    });

    await admin
      .from('transactions')
      .update({
        yookassa_payment_id: payment.id,
        yookassa_payment_url: payment.confirmation.confirmation_url,
      } as never)
      .eq('id', transaction.id);

    return NextResponse.json({ confirmationUrl: payment.confirmation.confirmation_url });
  } catch (err) {
    await admin
      .from('transactions')
      .update({ status: 'failed' } as never)
      .eq('id', transaction.id);

    console.error('YooKassa error:', err);
    return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 });
  }
}
