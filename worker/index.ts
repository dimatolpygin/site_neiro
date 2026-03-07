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

    if (type === 'image') {
      const imageUrl = parameters.image_url as string | undefined;
      const quality = parameters.quality as string | undefined;
      const aspectRatio = parameters.aspect_ratio as string | undefined;
      const size = parameters.size as string | undefined;

      if (model.includes('flux-2-max')) {
        input = { images: imageUrl ? [imageUrl] : [], prompt, size: size ?? '1024*1024' };
      } else if (model.includes('gpt-image-1.5')) {
        input = { images: imageUrl ? [imageUrl] : [], prompt, size: size ?? '1024*1024', quality: quality ?? 'medium' };
      } else if (model.includes('nano-banana')) {
        const resolution = quality ?? '1k';
        input = { prompt, image: imageUrl, aspect_ratio: aspectRatio, resolution };
      } else if (model.includes('seedream')) {
        if (!imageUrl) throw new Error('Seedream требует исходное изображение');
        input = { images: [imageUrl], prompt, size: size ?? '2048*2048' };
      } else {
        // FLUX Dev и другие image T2I
        if (imageUrl) {
          input = { prompt, image: imageUrl };
        } else {
          const w = (parameters.width as number) ?? 1024;
          const h = (parameters.height as number) ?? 1024;
          input = { prompt, size: `${w}*${h}`, num_inference_steps: 28, guidance_scale: 3.5 };
        }
      }
    } else {
      // Video: строим input в зависимости от модели
      const duration = (parameters.duration as number) ?? 5;
      const imageUrl = parameters.image_url as string | undefined;
      const aspectRatio = parameters.aspect_ratio as string | undefined;
      const quality = parameters.quality as string | undefined;

      if (model.includes('sora-2')) {
        // Sora 2: duration строго из [4, 8, 12]с
        const soraDur = ([4, 8, 12] as number[]).includes(duration) ? duration : 4;
        if (model.includes('image-to-video')) {
          if (!imageUrl) throw new Error('Sora i2v требует исходное изображение');
          input = { prompt, image: imageUrl, duration: soraDur };
        } else {
          input = { prompt, size: (parameters.size as string) ?? '1280*720', duration: soraDur };
        }
      } else if (model.includes('seedance')) {
        const resolution = quality ?? '720p';
        input = {
          prompt, image: imageUrl, duration, resolution, generate_audio: true,
          ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
        };
      } else if (model.includes('kling-video-o3-pro')) {
        if (!imageUrl) throw new Error('Kling Omni O3 Pro требует исходное изображение');
        const sound = (parameters.sound as boolean) ?? false;
        input = { prompt, image: imageUrl, duration, sound, element_list: [], multi_prompt: [] };
      } else {
        // kling-v2.6-std, kling-v2.0, kling-v2.1 — стандарт
        if (!imageUrl) throw new Error('Модель требует исходное изображение');
        input = { prompt, image: imageUrl, duration };
      }
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
    console.error(`Job ${generationId} failed (attempt ${job.attemptsMade}):`, errorMessage);

    // Финальная попытка — помечаем как failed и делаем возврат средств
    const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
    if (isFinalAttempt) {
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
    }
    // На промежуточных попытках не трогаем DB/redis — BullMQ ретраит, статус остаётся 'processing'

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
