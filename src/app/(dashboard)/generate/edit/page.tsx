import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EditGenerationForm } from '@/components/generate/EditGenerationForm';
import type { ModelPricing } from '@/types/database';

export default async function EditGeneratePage() {
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
        <h1 className="text-2xl font-bold">Редактирование фото</h1>
        <p className="text-muted-foreground">Измените изображение с помощью AI — укажите URL фото и опишите изменения</p>
      </div>
      {models.length === 0 ? (
        <div className="border-2 border-black p-6 bg-[#FFE600] shadow-[4px_4px_0px_#000]">
          <p className="font-bold text-black">Модели редактирования не настроены. Обратитесь к администратору.</p>
        </div>
      ) : (
        <EditGenerationForm models={models} />
      )}
    </div>
  );
}
