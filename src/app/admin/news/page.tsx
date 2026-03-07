import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { News } from '@/types/database';
import { NewsAdminForm, NewsEditButton, NewsDeleteButton } from './NewsAdminForm';

async function toggleNews(id: string, current: boolean) {
  'use server';
  const supabase = await createClient();
  await supabase.from('news').update({ is_active: !current }).eq('id', id);
  revalidatePath('/admin/news');
}

async function deleteNews(id: string) {
  'use server';
  const supabase = await createClient();
  await supabase.from('news').delete().eq('id', id);
  revalidatePath('/admin/news');
}

export default async function AdminNewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false });

  const news = (data ?? []) as News[];

  return (
    <div>
      <h1 className="text-2xl font-black uppercase mb-6">Управление новостями</h1>
      <NewsAdminForm />

      <div className="space-y-3 mt-6">
        {news.map(item => (
          <div
            key={item.id}
            className="border-2 border-black shadow-[3px_3px_0px_#000] p-4 bg-white dark:bg-zinc-900 flex items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-bold px-2 py-0.5 border border-black ${
                    item.is_active ? 'bg-green-400' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {item.is_active ? 'Активна' : 'Скрыта'}
                </span>
                {item.tags.map(t => (
                  <span key={t} className="text-xs border border-black px-1 bg-[#FFE600]">{t}</span>
                ))}
              </div>
              <p className="font-bold text-sm truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">/news → slug: {item.slug}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <NewsEditButton news={item} />
              <form action={toggleNews.bind(null, item.id, item.is_active)}>
                <button
                  type="submit"
                  className="text-xs font-bold border-2 border-black px-3 py-1 hover:bg-[#FFE600] transition-all"
                >
                  {item.is_active ? 'Скрыть' : 'Показать'}
                </button>
              </form>
              <NewsDeleteButton action={deleteNews.bind(null, item.id)} />
            </div>
          </div>
        ))}
        {news.length === 0 && (
          <p className="text-muted-foreground text-sm">Новостей нет. Добавьте первую!</p>
        )}
      </div>
    </div>
  );
}
