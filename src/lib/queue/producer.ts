import { Queue } from 'bullmq';

export interface GenerationJob {
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

const generationQueue = new Queue<GenerationJob>('generation', {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export async function addGenerationJob(data: GenerationJob): Promise<string> {
  const job = await generationQueue.add('generate', data, {
    jobId: data.generationId,
  });
  return job.id!;
}

export default generationQueue;
