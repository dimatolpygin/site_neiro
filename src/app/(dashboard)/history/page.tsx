import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GenerationHistoryTable } from '@/components/dashboard/GenerationHistoryTable';
import type { Generation } from '@/types/database';

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const generations = (data ?? []) as Generation[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">История генераций</h1>
        <p className="text-muted-foreground">Все ваши предыдущие генерации</p>
      </div>
      <GenerationHistoryTable generations={generations} />
    </div>
  );
}
