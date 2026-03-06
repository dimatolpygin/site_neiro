import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ImageGenerationForm } from '@/components/generate/ImageGenerationForm';
import type { ModelPricing } from '@/types/database';

export default async function ImageGeneratePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('model_pricing')
    .select('*')
    .eq('type', 'image')
    .eq('is_active', true)
    .order('cost_kopecks');

  const models = (data ?? []) as ModelPricing[];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Генерация изображений</h1>
        <p className="text-muted-foreground">Создайте изображение с помощью AI FLUX моделей</p>
      </div>
      <ImageGenerationForm models={models} />
    </div>
  );
}
