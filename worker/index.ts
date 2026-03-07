import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Worker, type Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import type { Generation, Profile } from '../src/types/database';

interface GenerationJob {
  generationId: string;
  userId: string;
  type: 'image' | 'video';
  model: string;
  prompt: string;
  parameters: Record<string, unknown>;
}

function getConnection() {
  const url = new URL(process.env.REDIS_URL!);
  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    username: url.username || undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
  };
}

const connection = getConnection();

// Use bullmq's own ioredis for separate redis operations
import type { Redis as IORedis } from 'ioredis';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: Redis } = require('bullmq/node_modules/ioredis') as { default: typeof import('ioredis').Redis };
const redis: IORedis = new (Redis as unknown as new (opts: object) => IORedis)(connection);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WAVESPEED_BASE_URL = 'https://api.wavespeed.ai/api/v3';

interface WavespeedResult {
  id: string;
  status: string;
  outputs?: string[];
  error?: string;
}

async function wavespeedGenerate(model: string, input: object): Promise<string> {
  const createRes = await fetch(`${WAVESPEED_BASE_URL}/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`WaveSpeed create error ${createRes.status}: ${text}`);
  }

  const createData = await createRes.json() as { data: WavespeedResult };
  const prediction = createData.data;

  let result: WavespeedResult = prediction;

  while (result.status !== 'completed' && result.status !== 'failed') {
    await new Promise(r => setTimeout(r, 3000));
    const pollRes = await fetch(`${WAVESPEED_BASE_URL}/predictions/${prediction.id}/result`, {
      headers: { 'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}` },
    });
    const pollData = await pollRes.json() as { data: WavespeedResult };
    result = pollData.data;
  }

  if (result.status === 'failed' || !result.outputs?.length) {
    throw new Error(result.error || 'Generation failed');
  }

  return result.outputs[0];
}

async function processJob(job: Job<GenerationJob>) {
  const { generationId, userId, type, model, prompt, parameters } = job.data;

  console.log(`Processing job ${generationId} (${type})`);

  await supabase
    .from('generations')
    .update({ status: 'processing', job_id: job.id } as never)
    .eq('id', generationId);

  try {
    let input: object;

    if (type === 'image' && parameters.image_url) {
      input = {
        images: [parameters.image_url as string],
        prompt,
      };
    } else if (type === 'image') {
      const w = (parameters.width as number) ?? 1024;
      const h = (parameters.height as number) ?? 1024;
      input = {
        prompt,
        size: `${w}*${h}`,
        num_inference_steps: 28,
        guidance_scale: 3.5,
      };
    } else {
      input = {
        prompt,
        duration: (parameters.duration as number) ?? 5,
      };
    }

    const resultUrl = await wavespeedGenerate(model, input);

    await supabase
      .from('generations')
      .update({
        status: 'completed',
        result_url: resultUrl,
        completed_at: new Date().toISOString(),
      } as never)
      .eq('id', generationId);

    const cacheData = { status: 'completed', resultUrl, errorMessage: null };
    await redis.setex(`gen:result:${generationId}`, 3600, JSON.stringify(cacheData));

    console.log(`Job ${generationId} completed: ${resultUrl}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Job ${generationId} failed:`, errorMessage);

    await supabase
      .from('generations')
      .update({ status: 'failed', error_message: errorMessage } as never)
      .eq('id', generationId);

    // Refund
    const { data: genData } = await supabase
      .from('generations')
      .select('cost_kopecks')
      .eq('id', generationId)
      .single();

    const generation = genData as Generation | null;

    if (generation) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      const profile = profileData as Profile | null;

      if (profile) {
        const newBalance = profile.balance + generation.cost_kopecks;
        await supabase
          .from('profiles')
          .update({ balance: newBalance } as never)
          .eq('id', userId);

        await supabase.from('transactions').insert({
          user_id: userId,
          type: 'refund',
          status: 'completed',
          amount_kopecks: generation.cost_kopecks,
          balance_before: profile.balance,
          balance_after: newBalance,
          description: 'Возврат за неудачную генерацию',
          generation_id: generationId,
        } as never);
      }
    }

    const cacheData = { status: 'failed', resultUrl: null, errorMessage };
    await redis.setex(`gen:result:${generationId}`, 3600, JSON.stringify(cacheData));

    throw err;
  }
}

const worker = new Worker<GenerationJob>('generation', processJob, {
  connection,
  concurrency: 3,
});

worker.on('completed', job => {
  console.log(`Job ${job.id} done`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on('error', err => {
  console.error('Worker error:', err);
});

console.log('BullMQ worker started, waiting for jobs...');

process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});
