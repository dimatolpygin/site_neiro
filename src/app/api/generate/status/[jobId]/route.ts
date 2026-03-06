import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import redis from '@/lib/redis';
import type { Generation } from '@/types/database';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = params;

  const cached = await redis.get(`gen:result:${jobId}`);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  const { data } = await supabase
    .from('generations')
    .select('status, result_url, error_message, user_id')
    .eq('id', jobId)
    .single();

  const generation = data as Generation | null;

  if (!generation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (generation.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = {
    status: generation.status,
    resultUrl: generation.result_url,
    errorMessage: generation.error_message,
  };

  if (generation.status === 'completed' || generation.status === 'failed') {
    await redis.setex(`gen:result:${jobId}`, 3600, JSON.stringify(result));
  }

  return NextResponse.json(result);
}
