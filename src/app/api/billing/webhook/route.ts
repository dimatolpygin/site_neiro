import { NextRequest, NextResponse } from 'next/server';
import { isYooKassaIp } from '@/lib/yookassa';
import redis from '@/lib/redis';
import { createServiceClient } from '@/lib/supabase/server';
import type { Transaction } from '@/types/database';

export async function POST(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const clientIp = forwardedFor?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? '';

  if (!isYooKassaIp(clientIp)) {
    console.warn(`Webhook from unknown IP: ${clientIp}`);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  if (body.event !== 'payment.succeeded') {
    return NextResponse.json({ ok: true });
  }

  const payment = body.object;
  const paymentId = payment.id;
  const { userId, transactionId } = payment.metadata ?? {};

  if (!paymentId || !userId || !transactionId) {
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
  }

  const idempotencyKey = `webhook:processed:${paymentId}`;
  const isNew = await redis.set(idempotencyKey, '1', 'EX', 86400, 'NX');

  if (!isNew) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const admin = createServiceClient();

  const { data: txData } = await admin
    .from('transactions')
    .select('amount_kopecks, description')
    .eq('id', transactionId)
    .single();

  const transaction = txData as Transaction | null;

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  const { data: credited } = await admin.rpc('credit_balance', {
    p_user_id: userId,
    p_amount: transaction.amount_kopecks,
    p_yookassa_id: paymentId,
    p_description: transaction.description ?? 'Пополнение баланса',
  } as never);

  if (!credited) {
    console.error(`Failed to credit balance for userId=${userId}, paymentId=${paymentId}`);
    return NextResponse.json({ error: 'Failed to credit balance' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
