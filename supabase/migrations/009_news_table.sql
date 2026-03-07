CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  content text,
  image_url text,
  model_slug text,
  tags text[] DEFAULT '{}',
  published_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_public_read" ON public.news FOR SELECT USING (is_active = true);

INSERT INTO public.news (slug, title, description, tags, model_slug) VALUES
  ('kling-v2-6-launch', 'Kling V2.6 Standard — новый стандарт i2v', 'ByteDance выпустил Kling 2.6 с плавной моторикой и кинематографическим качеством. Доступен на нашей платформе.', ARRAY['video','kling'], 'kling-v2-6-std'),
  ('seedream-edit', 'Seedream 5.0 Lite Edit — редактирование с сохранением лица', 'Новая edit-модель от ByteDance: high-fidelity редактирование с сохранением черт лица, освещения и цветовой гаммы.', ARRAY['image','edit','seedream'], 'seedream-v5-lite'),
  ('sora-2-i2v', 'Sora 2 Image-to-Video — физика OpenAI', 'OpenAI Sora 2 теперь доступна для преобразования фото в видео с безупречной физикой движения.', ARRAY['video','openai'], 'sora-2-i2v');
