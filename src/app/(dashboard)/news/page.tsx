import { createClient } from '@/lib/supabase/server';
import { NewsCard } from '@/components/news/NewsCard';
import type { News } from '@/types/database';

export default async function NewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('news')
    .select('*')
    .eq('is_active', true)
    .order('published_at', { ascending: false });

  const news = (data ?? []) as News[];

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white mb-2">
        Новости
      </h1>
      <p className="text-sm text-muted-foreground mb-8">Обновления и релизы AI-моделей</p>

      {news.length === 0 ? (
        <div className="border-2 border-black dark:border-zinc-700 p-8 text-center">
          <p className="font-bold text-black dark:text-white">Новостей пока нет</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map(item => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>
      )}
    </div>
  );
}
