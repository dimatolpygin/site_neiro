-- Migration 007: Marketplace Round 4 — новые модели, available_durations, nano banana настройки

-- Добавить столбец available_durations
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS available_durations jsonb NOT NULL DEFAULT '[]';

-- Деактивировать устаревшие модели
UPDATE public.models SET is_active = false WHERE slug IN (
  'flux-dev-fp8', 'wan-t2v-480p', 'wan-t2v-720p', 'kling-2', 'kling-v2-6-pro', 'sora-2'
);

-- Деактивировать устаревшие model_pricing записи
UPDATE public.model_pricing SET is_active = false WHERE model_id IN (
  'wavespeed-ai/flux-dev:fp8',
  'wavespeed-ai/flux-dev-fp8/text-to-image',
  'wavespeed-ai/wan-2.1/t2v-480p',
  'wavespeed-ai/wan-2.1/t2v-720p',
  'kwaivgi/kling-v2.0/t2v-master',
  'kwaivgi/kling-v2.1/t2v-master',
  'openai/sora-2/text-to-video'
);

-- Обновить Nano Banana 2 Edit — добавить aspect_ratio + resolution
UPDATE public.models SET
  available_sizes = '[
    {"value":"16:9","label":"16:9 Горизонтальный"},
    {"value":"9:16","label":"9:16 Вертикальный"},
    {"value":"1:1","label":"1:1 Квадрат"},
    {"value":"4:3","label":"4:3 Стандарт"}
  ]'::jsonb,
  available_quality = '[
    {"value":"1k","label":"1K (1024px)","cost_kopecks":1000},
    {"value":"2k","label":"2K (2048px)","cost_kopecks":2000}
  ]'::jsonb,
  cost_kopecks = 1000
WHERE slug = 'nano-banana-2-edit';

-- Обновить Nano Banana Pro Edit — добавить aspect_ratio + resolution с 3 уровнями
UPDATE public.models SET
  available_sizes = '[
    {"value":"16:9","label":"16:9 Горизонтальный"},
    {"value":"9:16","label":"9:16 Вертикальный"},
    {"value":"1:1","label":"1:1 Квадрат"},
    {"value":"4:3","label":"4:3 Стандарт"}
  ]'::jsonb,
  available_quality = '[
    {"value":"1k","label":"1K (1024px)","cost_kopecks":2000},
    {"value":"2k","label":"2K (2048px)","cost_kopecks":3500},
    {"value":"4k","label":"4K (4096px)","cost_kopecks":6000}
  ]'::jsonb,
  cost_kopecks = 2000
WHERE slug = 'nano-banana-pro-edit';

-- Новые видео модели (image-to-video)
INSERT INTO public.models (slug, name, description, type, endpoint, cost_kopecks, supports_image_input, available_sizes, available_quality, available_durations, templates, sort_order)
VALUES
(
  'kling-v2-6-std', 'Kling V2.6 Standard', 'Кинематографичная video-генерация из изображения', 'video',
  'kwaivgi/kling-v2.6-std/image-to-video', 1500, true,
  '[]'::jsonb, '[]'::jsonb,
  '[{"value":5,"label":"5 сек"},{"value":10,"label":"10 сек"}]'::jsonb,
  '["Плавное движение камеры вокруг объекта","Медленный зум с эффектом параллакса","Рябь на воде, отражение","Развевающиеся волосы на ветру","Падающие листья осенью"]',
  15
),
(
  'kling-video-o3-pro', 'Kling Omni O3 Pro', 'Профессиональная видеогенерация с поддержкой звука', 'video',
  'kwaivgi/kling-video-o3-pro/image-to-video', 3500, true,
  '[]'::jsonb, '[]'::jsonb,
  '[{"value":5,"label":"5 сек"},{"value":10,"label":"10 сек"},{"value":15,"label":"15 сек"}]'::jsonb,
  '["Кинематографичное движение камеры, натуральный звук","Городская сцена с атмосферными звуками","Природная сцена: ветер, вода, птицы","Портретное видео, эмоция и движение"]',
  16
),
(
  'sora-2-i2v', 'Sora 2 Image-to-Video', 'OpenAI Sora 2 — фото оживает с идеальной физикой', 'video',
  'openai/sora-2/image-to-video', 4000, true,
  '[]'::jsonb, '[]'::jsonb,
  '[{"value":4,"label":"4 сек"},{"value":8,"label":"8 сек"},{"value":12,"label":"12 сек"}]'::jsonb,
  '["Космическая сцена приходит в движение","Фотореалистичный персонаж начинает жить","Природный пейзаж, облака двигаются","Городская панорама, рассвет"]',
  17
),
(
  'seedance-v1-5-pro', 'Seedance 1.5 Pro', 'ByteDance — нативное аудио, мультиаспект', 'video',
  'bytedance/seedance-v1.5-pro/image-to-video-spicy', 2500, true,
  '[{"value":"21:9","label":"21:9 Ультраwide"},{"value":"16:9","label":"16:9 Горизонтальный"},{"value":"4:3","label":"4:3 Стандарт"},{"value":"1:1","label":"1:1 Квадрат"},{"value":"3:4","label":"3:4 Вертикальный"},{"value":"9:16","label":"9:16 Stories"}]'::jsonb,
  '[{"value":"480p","label":"480p"},{"value":"720p","label":"720p"},{"value":"1080p","label":"1080p"}]'::jsonb,
  '[{"value":5,"label":"5 сек"},{"value":10,"label":"10 сек"}]'::jsonb,
  '["Танец персонажа с музыкальным ритмом","Рекламный ролик продукта в движении","Природный таймлапс с нативным звуком","Портретное видео, улыбка и движение"]',
  18
)
ON CONFLICT (slug) DO NOTHING;

-- Новые фото / edit модели
INSERT INTO public.models (slug, name, description, type, endpoint, cost_kopecks, supports_image_input, available_sizes, available_quality, available_durations, templates, sort_order)
VALUES
(
  'flux-2-max', 'FLUX 2 Max Edit', 'Мощное редактирование изображений нового поколения', 'edit',
  'wavespeed-ai/flux-2-max/edit', 1200, true,
  '[{"value":"1024*1024","label":"1:1 (1024×1024)"},{"value":"1280*720","label":"16:9 (1280×720)"},{"value":"720*1280","label":"9:16 (720×1280)"},{"value":"1152*896","label":"4:3 (1152×896)"}]'::jsonb,
  '[]'::jsonb, '[]'::jsonb,
  '["Измени стиль на акварель","Добавь реалистичный закат на фон","Переодень персонажа","Трансформируй в аниме-арт","Добавь природные элементы"]',
  5
),
(
  'gpt-image-1-5', 'GPT Image 1.5 Edit', 'OpenAI — точное редактирование по инструкции', 'edit',
  'openai/gpt-image-1.5/edit', 1500, true,
  '[{"value":"auto","label":"Авто"},{"value":"1024*1024","label":"1:1 (1024×1024)"},{"value":"1024*1536","label":"2:3 (1024×1536)"},{"value":"1536*1024","label":"3:2 (1536×1024)"}]'::jsonb,
  '[{"value":"low","label":"Низкое","cost_kopecks":800},{"value":"medium","label":"Среднее","cost_kopecks":1500},{"value":"high","label":"Высокое","cost_kopecks":2500}]'::jsonb,
  '[]'::jsonb,
  '["Измени фон на профессиональную студию","Добавь реалистичный продукт в сцену","Измени время суток на закат","Добавь текстовую надпись в стиле бренда","Трансформируй в другой стиль"]',
  6
),
(
  'seedream-v5-lite', 'Seedream 5.0 Lite', 'ByteDance — быстрая генерация изображений', 'image',
  'bytedance/seedream-v5.0-lite', 600, false,
  '[{"value":"1024*1024","label":"1:1 (1024×1024)"},{"value":"1280*720","label":"16:9 (1280×720)"},{"value":"720*1280","label":"9:16 (720×1280)"},{"value":"1152*896","label":"4:3 (1152×896)"}]'::jsonb,
  '[]'::jsonb, '[]'::jsonb,
  '["Портрет в студийном свете, фотореализм","Пейзаж с горами и туманом на рассвете","Современный интерьер в минималистичном стиле","Фантастический город будущего ночью","Натюрморт с цветами, тёплое освещение"]',
  7
)
ON CONFLICT (slug) DO NOTHING;

-- Добавить model_pricing для новых моделей
INSERT INTO public.model_pricing (model_id, display_name, type, cost_kopecks, is_active)
VALUES
  ('kwaivgi/kling-v2.6-std/image-to-video',            'Kling V2.6 Standard',    'video', 1500, true),
  ('kwaivgi/kling-video-o3-pro/image-to-video',        'Kling Omni O3 Pro',      'video', 3500, true),
  ('openai/sora-2/image-to-video',                     'Sora 2 Image-to-Video',  'video', 4000, true),
  ('bytedance/seedance-v1.5-pro/image-to-video-spicy', 'Seedance 1.5 Pro',       'video', 2500, true),
  ('wavespeed-ai/flux-2-max/edit',                     'FLUX 2 Max Edit',        'image', 1200, true),
  ('openai/gpt-image-1.5/edit',                        'GPT Image 1.5 Edit',     'image', 1500, true),
  ('bytedance/seedream-v5.0-lite',                     'Seedream 5.0 Lite',      'image',  600, true)
ON CONFLICT (model_id) DO UPDATE SET cost_kopecks = EXCLUDED.cost_kopecks, is_active = true;
