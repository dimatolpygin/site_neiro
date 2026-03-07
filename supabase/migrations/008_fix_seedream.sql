-- Fix seedream: endpoint, type, supports_image_input, available_sizes
UPDATE public.models SET
  endpoint = 'bytedance/seedream-v5.0-lite/edit',
  type = 'edit',
  supports_image_input = true,
  available_sizes = '[
    {"value":"2048*2048","label":"1:1 (2048×2048)"},
    {"value":"2560*1440","label":"16:9 (2560×1440)"},
    {"value":"1440*2560","label":"9:16 (1440×2560)"},
    {"value":"2560*1920","label":"4:3 (2560×1920)"}
  ]'::jsonb
WHERE slug = 'seedream-v5-lite';

-- Деактивировать старую model_pricing
UPDATE public.model_pricing SET is_active = false
WHERE model_id = 'bytedance/seedream-v5.0-lite';

-- Добавить новую model_pricing для edit-endpoint
INSERT INTO public.model_pricing (model_id, display_name, type, cost_kopecks, is_active)
VALUES ('bytedance/seedream-v5.0-lite/edit', 'Seedream 5.0 Lite Edit', 'image', 600, true)
ON CONFLICT (model_id) DO UPDATE SET cost_kopecks = EXCLUDED.cost_kopecks, is_active = true;
