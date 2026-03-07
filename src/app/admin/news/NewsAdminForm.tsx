'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { News } from '@/types/database';

interface FormData {
  slug: string;
  title: string;
  description: string;
  content: string;
  image_url: string;
  model_slug: string;
  tags: string;
}

const empty: FormData = {
  slug: '',
  title: '',
  description: '',
  content: '',
  image_url: '',
  model_slug: '',
  tags: '',
};

const FIELDS: [keyof FormData, string, boolean][] = [
  ['title', 'Заголовок *', true],
  ['slug', 'Slug (URL) *', true],
  ['description', 'Лид / краткое описание *', true],
  ['image_url', 'URL обложки (фото)', false],
  ['model_slug', 'Slug модели (для кнопки)', false],
  ['tags', 'Теги (через запятую)', false],
  ['content', 'Текст статьи (Markdown)', false],
];

function NewsForm({
  initial,
  id,
  onClose,
}: {
  initial: FormData;
  id?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/news', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...form,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Ошибка сервера');
      }
      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-2 border-black shadow-[4px_4px_0px_#000] p-6 bg-white dark:bg-zinc-900 mb-4">
      <h2 className="text-lg font-black mb-1">{id ? 'Редактировать новость' : 'Новая новость'}</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Текст статьи поддерживает <strong>Markdown</strong>: **жирный**, *курсив*, ## Заголовок, ![alt](url_фото), [YouTube](url_видео), [видео.mp4](url_mp4)
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map(([field, label, req]) => (
          <div key={field} className={field === 'description' || field === 'content' ? 'md:col-span-2' : ''}>
            <label className="block text-xs font-bold mb-1 uppercase">{label}</label>
            {field === 'content' ? (
              <textarea
                value={form[field]}
                onChange={e => set(field, e.target.value)}
                required={req}
                rows={16}
                placeholder={'## Введение\n\nТекст статьи...\n\n![Описание фото](https://example.com/photo.jpg)\n\n[Смотреть видео](https://youtu.be/VIDEO_ID)'}
                className="w-full border-2 border-black dark:border-zinc-600 px-3 py-2 text-sm font-mono bg-white dark:bg-zinc-800"
              />
            ) : field === 'description' ? (
              <textarea
                value={form[field]}
                onChange={e => set(field, e.target.value)}
                required={req}
                rows={3}
                className="w-full border-2 border-black dark:border-zinc-600 px-3 py-2 text-sm font-mono bg-white dark:bg-zinc-800"
              />
            ) : (
              <input
                type="text"
                value={form[field]}
                onChange={e => set(field, e.target.value)}
                required={req}
                className="w-full border-2 border-black dark:border-zinc-600 px-3 py-2 text-sm font-mono bg-white dark:bg-zinc-800"
              />
            )}
          </div>
        ))}
        {error && (
          <div className="md:col-span-2 border-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="border-2 border-black font-bold px-4 py-2 bg-[#FFE600] shadow-[3px_3px_0px_#000] hover:shadow-none transition-all disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : id ? 'Сохранить' : 'Создать'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-black font-bold px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

export function NewsAdminForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border-2 border-black font-bold px-4 py-2 bg-[#FFE600] shadow-[3px_3px_0px_#000] hover:shadow-none transition-all"
      >
        + Добавить новость
      </button>
    );
  }

  return <NewsForm initial={empty} onClose={() => setOpen(false)} />;
}

export function NewsDeleteButton({ action }: { action: () => Promise<void> }) {
  return (
    <button
      onClick={async e => {
        if (!confirm('Удалить новость?')) return;
        await action();
      }}
      className="text-xs font-bold border-2 border-black px-3 py-1 hover:bg-[#FF2D78] hover:text-white transition-all"
    >
      Удалить
    </button>
  );
}

export function NewsEditButton({ news }: { news: News }) {
  const [open, setOpen] = useState(false);

  const initial: FormData = {
    slug: news.slug,
    title: news.title,
    description: news.description,
    content: news.content ?? '',
    image_url: news.image_url ?? '',
    model_slug: news.model_slug ?? '',
    tags: news.tags.join(', '),
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-bold border-2 border-black px-3 py-1 hover:bg-[#FFE600] transition-all"
      >
        Редактировать
      </button>
    );
  }

  return (
    <div className="md:col-span-full">
      <NewsForm initial={initial} id={news.id} onClose={() => setOpen(false)} />
    </div>
  );
}
