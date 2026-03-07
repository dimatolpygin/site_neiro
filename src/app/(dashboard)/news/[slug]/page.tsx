import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ArticleContent } from '@/components/news/ArticleContent';
import type { News } from '@/types/database';
import { ArrowLeft } from 'lucide-react';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('news')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!data) notFound();
  const news = data as News;

  return (
    <div className="max-w-3xl">
      <Link
        href="/news"
        className="inline-flex items-center gap-2 font-black uppercase text-sm border-2 border-black dark:border-zinc-600 px-3 py-2 shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform bg-white dark:bg-zinc-900 mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Все новости
      </Link>

      {/* Обложка */}
      {news.image_url && (
        <img
          src={news.image_url}
          alt={news.title}
          className="w-full h-64 object-cover border-2 border-black dark:border-zinc-600 shadow-[4px_4px_0px_#000] mb-6"
        />
      )}

      {/* Теги + дата */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {news.tags.map(tag => (
          <span
            key={tag}
            className="text-xs font-bold px-2 py-0.5 border-2 border-black dark:border-zinc-600 bg-[#FFE600] text-black uppercase"
          >
            {tag}
          </span>
        ))}
        <span className="text-xs text-muted-foreground ml-auto">{formatDate(news.published_at)}</span>
      </div>

      {/* Заголовок */}
      <h1 className="text-4xl font-black uppercase tracking-tight text-black dark:text-white mb-4 border-b-4 border-black dark:border-zinc-700 pb-4">
        {news.title}
      </h1>

      {/* Описание (лид) */}
      <p className="text-lg font-medium text-gray-600 dark:text-zinc-400 mb-8">{news.description}</p>

      {/* Контент */}
      {news.content ? (
        <ArticleContent content={news.content} />
      ) : (
        <p className="text-muted-foreground italic">Полный текст статьи пока не добавлен.</p>
      )}

      {/* Ссылка на модель */}
      {news.model_slug && (
        <div className="mt-10 border-t-4 border-black dark:border-zinc-700 pt-6">
          <Link
            href={`/models/${news.model_slug}`}
            className="inline-flex items-center gap-2 font-black uppercase text-sm border-2 border-black dark:border-zinc-600 px-4 py-2 bg-[#FFE600] shadow-[3px_3px_0px_#000] hover:shadow-none transition-all text-black"
          >
            Попробовать модель →
          </Link>
        </div>
      )}
    </div>
  );
}
