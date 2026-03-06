const WAVESPEED_BASE_URL = 'https://api.wavespeed.ai/api/v3';

interface GenerateImageParams {
  model: string;
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
}

interface GenerateVideoParams {
  model: string;
  prompt: string;
  duration?: number;
}

interface WavespeedResponse {
  id: string;
  status: string;
  outputs?: string[];
  error?: string;
}

interface WavespeedApiResponse {
  code: number;
  data: WavespeedResponse;
}

async function apiCall(model: string, body: object): Promise<WavespeedResponse> {
  const res = await fetch(`${WAVESPEED_BASE_URL}/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WaveSpeed API error ${res.status}: ${err}`);
  }

  const json = await res.json() as WavespeedApiResponse;
  return json.data;
}

async function getResult(predictionId: string): Promise<WavespeedResponse> {
  const res = await fetch(`${WAVESPEED_BASE_URL}/predictions/${predictionId}/result`, {
    headers: {
      'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`WaveSpeed status error ${res.status}`);
  }

  const json = await res.json() as WavespeedApiResponse;
  return json.data;
}

export async function generateImage(params: GenerateImageParams): Promise<string> {
  const prediction = await apiCall(params.model, {
    prompt: params.prompt,
    size: `${params.width ?? 1024}*${params.height ?? 1024}`,
    num_inference_steps: params.steps ?? 28,
    guidance_scale: params.guidance ?? 3.5,
  });

  let result = prediction;
  while (result.status !== 'completed' && result.status !== 'failed') {
    await new Promise(r => setTimeout(r, 2000));
    result = await getResult(result.id);
  }

  if (result.status === 'failed' || !result.outputs?.length) {
    throw new Error(result.error || 'Generation failed');
  }

  return result.outputs[0];
}

export async function editImage(params: { model: string; imageUrl: string; prompt: string }): Promise<string> {
  const prediction = await apiCall(params.model, {
    image: params.imageUrl,
    prompt: params.prompt,
  });

  let result = prediction;
  while (result.status !== 'completed' && result.status !== 'failed') {
    await new Promise(r => setTimeout(r, 2000));
    result = await getResult(result.id);
  }

  if (result.status === 'failed' || !result.outputs?.length) {
    throw new Error(result.error || 'Edit failed');
  }

  return result.outputs[0];
}

export async function generateVideo(params: GenerateVideoParams): Promise<string> {
  const prediction = await apiCall(params.model, {
    prompt: params.prompt,
    duration: params.duration ?? 5,
  });

  let result = prediction;
  while (result.status !== 'completed' && result.status !== 'failed') {
    await new Promise(r => setTimeout(r, 5000));
    result = await getResult(result.id);
  }

  if (result.status === 'failed' || !result.outputs?.length) {
    throw new Error(result.error || 'Video generation failed');
  }

  return result.outputs[0];
}
