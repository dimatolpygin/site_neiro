-- Fix: исправить endpoints в таблице models (migration 003 засеял неверный формат)
UPDATE public.models SET endpoint = 'wavespeed-ai/flux-dev'     WHERE slug = 'flux-dev';
UPDATE public.models SET endpoint = 'wavespeed-ai/flux-dev:fp8' WHERE slug = 'flux-dev-fp8';

-- Fix: удалить ошибочные строки из model_pricing (добавленные в migration 003)
DELETE FROM public.model_pricing WHERE model_id IN (
  'wavespeed-ai/flux-dev/text-to-image',
  'wavespeed-ai/flux-dev-fp8/text-to-image'
);

-- Убедиться что edit-модели есть в model_pricing
INSERT INTO public.model_pricing (model_id, display_name, type, cost_kopecks, is_active)
VALUES
  ('google/nano-banana-2/edit',   'Nano Banana 2 Edit',  'image', 1000, true),
  ('google/nano-banana-pro/edit', 'Nano Banana Pro Edit', 'image', 2000, true)
ON CONFLICT (model_id) DO UPDATE SET cost_kopecks = EXCLUDED.cost_kopecks, is_active = true;

-- Storage: создать bucket если не существует
INSERT INTO storage.buckets (id, name, public)
VALUES ('generation-images', 'generation-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage: политика upload для authenticated пользователей
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'auth_upload'
  ) THEN
    CREATE POLICY "auth_upload" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'generation-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'generation-images');
  END IF;
END $$;
