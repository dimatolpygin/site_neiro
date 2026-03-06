import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { GenerationHistoryTable } from '@/components/dashboard/GenerationHistoryTable';
import Link from 'next/link';
import { ImageIcon, Video } from 'lucide-react';
import type { Generation } from '@/types/database';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: genData } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: statsData } = await supabase
    .from('generations')
    .select('status')
    .eq('user_id', user.id);

  const recentGenerations = (genData ?? []) as Generation[];
  const stats = (statsData ?? []) as Pick<Generation, 'status'>[];

  const totalCount = stats.length;
  const completedCount = stats.filter(g => g.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-black">Обзор</h1>
        <p className="font-medium text-black/60">Добро пожаловать в ИИ Генератор</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BalanceCard />
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#FFE600] rounded-none p-6">
          <p className="text-sm font-bold uppercase tracking-wide text-black/60 mb-2">Генераций всего</p>
          <div className="text-6xl font-black text-black">{totalCount}</div>
        </div>
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#00E5A0] rounded-none p-6">
          <p className="text-sm font-bold uppercase tracking-wide text-black/60 mb-2">Успешных</p>
          <div className="text-6xl font-black text-black">{completedCount}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-none p-8 flex flex-col items-center justify-center gap-4 hover:-translate-y-1 hover:shadow-[4px_8px_0px_#000] transition-all">
          <div className="w-16 h-16 border-2 border-black bg-[#FFE600] flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-black" />
          </div>
          <p className="font-black uppercase tracking-tight text-black">Создать изображение</p>
          <Link
            href="/generate/image"
            className="px-6 py-2 font-bold text-sm bg-black text-white border-2 border-black shadow-[3px_3px_0px_#FF2D78] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform uppercase"
          >
            Открыть
          </Link>
        </div>
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-none p-8 flex flex-col items-center justify-center gap-4 hover:-translate-y-1 hover:shadow-[4px_8px_0px_#000] transition-all">
          <div className="w-16 h-16 border-2 border-black bg-[#00E5A0] flex items-center justify-center">
            <Video className="h-8 w-8 text-black" />
          </div>
          <p className="font-black uppercase tracking-tight text-black">Создать видео</p>
          <Link
            href="/generate/video"
            className="px-6 py-2 font-bold text-sm bg-black text-white border-2 border-black shadow-[3px_3px_0px_#00E5A0] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform uppercase"
          >
            Открыть
          </Link>
        </div>
      </div>

      {recentGenerations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black uppercase tracking-tight text-black">Последние генерации</h2>
            <Link href="/history" className="text-sm font-bold border-2 border-black px-3 py-1 hover:bg-[#FFE600] transition-colors">
              Все →
            </Link>
          </div>
          <GenerationHistoryTable generations={recentGenerations} />
        </div>
      )}
    </div>
  );
}
