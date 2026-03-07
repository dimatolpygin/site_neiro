-- КРИТИЧЕСКИЙ FIX: добавить model_pricing для исправленных image-endpoint'ов
INSERT INTO public.model_pricing (model_id, display_name, type, cost_kopecks, is_active)
VALUES
  ('wavespeed-ai/flux-dev',     'FLUX Dev',        'image', 500, true),
  ('wavespeed-ai/flux-dev:fp8', 'FLUX Dev FP8 HD', 'image', 800, true)
ON CONFLICT (model_id) DO UPDATE SET cost_kopecks = EXCLUDED.cost_kopecks, is_active = true;

-- Добавить video-модели в таблицу models
INSERT INTO public.models (slug, name, description, type, endpoint, cost_kopecks, supports_image_input, available_sizes, available_quality, templates, sort_order)
VALUES
(
  'wan-t2v-480p', 'Wan T2V 480p', 'Быстрая генерация видео из текста, 480p', 'video',
  'wavespeed-ai/wan-t2v-480p', 1400, false,
  '[]', '[]',
  '["Закат над океаном, волны, замедленная съёмка","Городская улица ночью, неоновые огни, дождь","Полёт над горами на рассвете","Цветущая сакура, лепестки падают на ветру","Огонь в камине, уютный вечер"]',
  10
),
(
  'wan-t2v-720p', 'Wan T2V 720p HD', 'Генерация видео из текста в HD качестве', 'video',
  'wavespeed-ai/wan-t2v-720p', 2800, false,
  '[]', '[]',
  '["Эпический космический пейзаж, туманность, звёзды","Водопад в тропическом лесу, HD","Гоночный автомобиль на трассе, динамичная съёмка","Северное сияние над снежной тундрой","Подводный мир: кораллы, рыбы, лучи света"]',
  11
),
(
  'kling-2', 'Kling 2.0', 'Кинематографичное видео с реалистичной физикой', 'video',
  'wavespeed-ai/kling-2-0', 2000, false,
  '[]', '[]',
  '["Золотистый ретривер бежит по лугу, замедленная съёмка","Кинематографичный портрет, студийный свет, движение камеры","Закат над океаном, волны, эпическая музыка","Древний лес в тумане, лучи рассветного солнца","Современный город с высоты птичьего полёта, ночь"]',
  12
),
(
  'kling-v2-6-pro', 'Kling 2.6 Pro', 'Топовая видеогенерация с нативным аудио', 'video',
  'kwaivgi/kling-v2.6-pro/text-to-video', 3500, false,
  '[{"label":"16:9","value":"16:9"},{"label":"9:16","value":"9:16"},{"label":"1:1","value":"1:1"}]',
  '[]',
  '["Кинематографичный рекламный ролик продукта, чистый фон, профессиональный свет","Фотореалистичный человек идёт по улице Токио, дождь, отражения неона","Природный таймлапс: цветок распускается на рассвете","Спортсмен в движении, динамичный ракурс снизу","Эпический фэнтези-пейзаж, дракон в небе"]',
  13
),
(
  'sora-2', 'Sora 2', 'OpenAI — лучшая физика и синхронное аудио', 'video',
  'openai/sora-2/text-to-video', 4000, false,
  '[{"label":"16:9 (1280×720)","value":"1280*720"},{"label":"9:16 (720×1280)","value":"720*1280"}]',
  '[]',
  '["Космонавт в красном шерстяном шлеме на фоне голубого неба и солевой пустыни, 35мм плёнка","Гиперреалистичный дракон над горным хребтом, закат, эпический ракурс","Медитирующий монах на вершине горы в облаках, замедленная съёмка","Будущий город с летающими машинами, ночь, неоновые отражения","Underwater shot: rays of light through crystal water, coral reef"]',
  14
)
ON CONFLICT (slug) DO NOTHING;

-- Добавить video model_pricing
INSERT INTO public.model_pricing (model_id, display_name, type, cost_kopecks, is_active)
VALUES
  ('wavespeed-ai/wan-t2v-480p',            'Wan T2V 480p',    'video', 1400, true),
  ('wavespeed-ai/wan-t2v-720p',            'Wan T2V 720p HD', 'video', 2800, true),
  ('wavespeed-ai/kling-2-0',               'Kling 2.0',       'video', 2000, true),
  ('kwaivgi/kling-v2.6-pro/text-to-video', 'Kling 2.6 Pro',   'video', 3500, true),
  ('openai/sora-2/text-to-video',          'Sora 2',          'video', 4000, true)
ON CONFLICT (model_id) DO UPDATE SET cost_kopecks = EXCLUDED.cost_kopecks, is_active = true;
