CREATE TABLE public.models (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  type             TEXT NOT NULL CHECK (type IN ('image', 'video', 'edit')),
  endpoint         TEXT NOT NULL,
  cost_kopecks     BIGINT NOT NULL DEFAULT 0,
  supports_image_input BOOLEAN NOT NULL DEFAULT false,
  available_sizes  JSONB NOT NULL DEFAULT '[]',
  available_quality JSONB NOT NULL DEFAULT '[]',
  templates        JSONB NOT NULL DEFAULT '[]',
  preview_url      TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: читать могут все аутентифицированные
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "models_select" ON public.models FOR SELECT TO authenticated USING (is_active = true);

-- Seed
INSERT INTO public.models (slug, name, description, type, endpoint, cost_kopecks, supports_image_input, available_sizes, available_quality, templates, sort_order) VALUES
(
  'flux-dev', 'FLUX Dev', 'Быстрая генерация изображений высокого качества', 'image',
  'wavespeed-ai/flux-dev/text-to-image', 500, false,
  '[{"label":"1:1","value":"1024*1024"},{"label":"16:9","value":"1280*720"},{"label":"9:16","value":"720*1280"}]',
  '[{"label":"Стандарт","value":"standard"}]',
  '["Портрет молодой женщины в стиле ренессанс, масло, детализация","Футуристический город ночью, неоновые огни, киберпанк","Горный пейзаж на рассвете, фотореализм","Абстрактная живопись в стиле Кандинского, яркие цвета","Уютное кафе в Париже, акварель","Космический корабль на фоне туманности, цифровое искусство"]',
  1
),
(
  'flux-dev-fp8', 'FLUX Dev FP8 HD', 'Улучшенное качество с повышенной детализацией', 'image',
  'wavespeed-ai/flux-dev-fp8/text-to-image', 800, false,
  '[{"label":"1:1","value":"1024*1024"},{"label":"16:9","value":"1280*720"},{"label":"9:16","value":"720*1280"}]',
  '[{"label":"HD","value":"hd"}]',
  '["Гиперреалистичный портрет, студийное освещение, 8K","Архитектура в стиле Гауди, детальная текстура камня","Дикая природа, макро-фотография насекомых","Замок на скале над облаками, эпическое освещение","Японский сад, сакура, утренний туман","Старинная карта мира, пергамент, чернила"]',
  2
),
(
  'nano-banana-2-edit', 'Nano Banana 2 Edit', 'Редактирование фото по текстовому описанию', 'edit',
  'google/nano-banana-2/edit', 1000, true,
  '[]', '[]',
  '["Измени фон на закат над океаном","Добавь снег и зимнюю атмосферу","Переодень человека в деловой костюм","Сделай стиль картины как у Ван Гога","Добавь цветы и весеннее настроение","Убери все лишние объекты, оставь только главный"]',
  3
),
(
  'nano-banana-pro-edit', 'Nano Banana Pro Edit', 'Профессиональное редактирование с максимальным качеством', 'edit',
  'google/nano-banana-pro/edit', 2000, true,
  '[]', '[]',
  '["Профессиональная ретушь портрета, студийный свет","Замени небо на драматичный закат","Добавь фотореалистичный огонь или воду","Измени время суток: из дня в ночь","Добавь реалистичную тень и объём","Перенеси объект в другую локацию"]',
  4
);

-- Добавить в model_pricing для совместимости с generate API
INSERT INTO public.model_pricing (model_id, display_name, type, cost_kopecks, is_active)
VALUES
  ('wavespeed-ai/flux-dev/text-to-image', 'FLUX Dev', 'image', 500, true),
  ('wavespeed-ai/flux-dev-fp8/text-to-image', 'FLUX Dev FP8 HD', 'image', 800, true),
  ('google/nano-banana-2/edit', 'Nano Banana 2 Edit', 'image', 1000, true),
  ('google/nano-banana-pro/edit', 'Nano Banana Pro Edit', 'image', 2000, true)
ON CONFLICT (model_id) DO UPDATE SET cost_kopecks = EXCLUDED.cost_kopecks, is_active = true;
