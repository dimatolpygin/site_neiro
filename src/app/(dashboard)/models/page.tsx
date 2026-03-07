import { createClient } from '@/lib/supabase/server';
import { ModelsGrid } from '@/components/models/ModelsGrid';
import type { Model } from '@/types/database';

export default async function ModelsPage() {
  const supabase = await createClient();

  const { data: models } = await supabase
    .from('models')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return (
    <div className="p-8 space-y-8">
      <div className="border-b-4 border-black pb-6">
        <h1 className="text-4xl font-black uppercase tracking-tight">Маркетплейс моделей</h1>
        <p className="text-gray-600 font-medium mt-2">
          Выберите модель ИИ для генерации и редактирования контента
        </p>
      </div>

      <ModelsGrid models={(models as Model[]) ?? []} />
    </div>
  );
}
