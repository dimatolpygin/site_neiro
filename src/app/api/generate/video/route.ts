import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/utils/rateLimit';
import { addGenerationJob } from '@/lib/queue/producer';
import type { ModelPricing, Generation } from '@/types/database';
import { z } from 'zod';

const schema = z.object({
  model: z.string().min(1),
  prompt: z.string().min(1).max(2000),
  duration: z.number().int().min(3).max(10).optional().default(5),
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

  const { model, prompt, duration } = parsed.data;

  const rateKey = `ratelimit:gen:${user.id}`;
  const rateResult = await checkRateLimit(rateKey, 5, 60);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a minute.' },
      { status: 429, headers: { 'Retry-After': String(rateResult.resetIn) } }
    );
  }

  const admin = createServiceClient();

  const { data: modelData } = await admin
    .from('model_pricing')
    .select('cost_kopecks')
    .eq('model_id', model)
    .eq('is_active', true)
    .single();

  const modelPricing = modelData as ModelPricing | null;

  if (!modelPricing) {
    return NextResponse.json({ error: 'Model not found' }, { status: 404 });
  }

  const { data: genData, error: genError } = await admin
    .from('generations')
    .insert({
      user_id: user.id,
      type: 'video',
      status: 'pending',
      prompt,
      parameters: { model, duration },
      cost_kopecks: modelPricing.cost_kopecks,
    } as never)
    .select()
    .single();

  if (genError || !genData) {
    return NextResponse.json({ error: 'Failed to create generation' }, { status: 500 });
  }

  const generation = genData as Generation;

  const { data: deducted } = await admin.rpc('deduct_balance', {
    p_user_id: user.id,
    p_amount: modelPricing.cost_kopecks,
    p_generation_id: generation.id,
    p_description: `Генерация видео (${model})`,
  } as never);

  if (!deducted) {
    await admin
      .from('generations')
      .update({ status: 'failed', error_message: 'Insufficient balance' } as never)
      .eq('id', generation.id);
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 402 });
  }

  await addGenerationJob({
    generationId: generation.id,
    userId: user.id,
    type: 'video',
    model,
    prompt,
    parameters: { duration },
  });

  return NextResponse.json({ generationId: generation.id });
}
