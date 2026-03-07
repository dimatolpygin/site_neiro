-- Migration 006: Fix video model endpoints (WaveSpeed correct paths)

-- Remove old incorrect model_pricing entries
DELETE FROM public.model_pricing WHERE model_id IN (
  'wavespeed-ai/wan-t2v-480p',
  'wavespeed-ai/wan-t2v-720p',
  'wavespeed-ai/kling-2-0',
  'kwaivgi/kling-v2.6-pro/text-to-video'
);

-- Fix endpoints in models table
UPDATE public.models SET endpoint = 'wavespeed-ai/wan-2.1/t2v-480p'  WHERE slug = 'wan-t2v-480p';
UPDATE public.models SET endpoint = 'wavespeed-ai/wan-2.1/t2v-720p'  WHERE slug = 'wan-t2v-720p';
UPDATE public.models SET endpoint = 'kwaivgi/kling-v2.0/t2v-master'  WHERE slug = 'kling-2';
UPDATE public.models SET
  endpoint = 'kwaivgi/kling-v2.1/t2v-master',
  name = 'Kling V2.1 Master',
  description = 'Флагманская кинематографичная видеогенерация ByteDance',
  cost_kopecks = 3000
WHERE slug = 'kling-v2-6-pro';

-- Insert correct model_pricing
INSERT INTO public.model_pricing (model_id, display_name, type, cost_kopecks, is_active)
VALUES
  ('wavespeed-ai/wan-2.1/t2v-480p',  'Wan 2.1 T2V 480p',    'video', 1400, true),
  ('wavespeed-ai/wan-2.1/t2v-720p',  'Wan 2.1 T2V 720p HD', 'video', 2800, true),
  ('kwaivgi/kling-v2.0/t2v-master',  'Kling V2.0 Master',   'video', 2000, true),
  ('kwaivgi/kling-v2.1/t2v-master',  'Kling V2.1 Master',   'video', 3000, true)
ON CONFLICT (model_id) DO UPDATE SET cost_kopecks = EXCLUDED.cost_kopecks, is_active = true;

-- Clean up stuck pending/processing generations older than 30 minutes
UPDATE public.generations
SET status = 'failed', error_message = 'Timeout: запрос не был обработан воркером'
WHERE status IN ('pending', 'processing')
  AND created_at < NOW() - INTERVAL '30 minutes';
