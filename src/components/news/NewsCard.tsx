import Link from 'next/link';
import type { News } from '@/types/database';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function NewsCard({ news }: { news: News }) {
  return (
    <div className="border-2 border-black dark:border-zinc-700 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#52525b] bg-white dark:bg-zinc-900 flex flex-col">
      {news.image_url && (
        <img
          src={news.image_url}
          alt={news.title}
          className="w-full h-48 object-cover border-b-2 border-black dark:border-zinc-700"
        />
      )}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex flex-wrap gap-1">
          {news.tags.map(tag => (
            <span
              key={tag}
              className="text-xs font-bold px-2 py-0.5 border-2 border-black dark:border-zinc-600 bg-[#FFE600] text-black uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">{formatDate(news.published_at)}</p>
          <h2 className="text-lg font-black leading-tight text-black dark:text-white">{news.title}</h2>
        </div>
        <p className="text-sm text-gray-700 dark:text-zinc-300 flex-1">{news.description}</p>
        {news.model_slug && (
          <Link
            href={`/models/${news.model_slug}`}
            className="self-start text-sm font-bold border-2 border-black dark:border-zinc-600 px-3 py-1 hover:bg-[#FFE600] hover:shadow-[2px_2px_0px_#000] transition-all text-black dark:text-white"
          >
            Смотреть модель →
          </Link>
        )}
      </div>
    </div>
  );
}
