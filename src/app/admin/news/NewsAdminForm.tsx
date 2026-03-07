'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

export function NewsAdminForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Ошибка сервера');
      }
      setForm(empty);
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div className="border-2 border-black shadow-[4px_4px_0px_#000] p-6 bg-white dark:bg-zinc-900 mb-6">
      <h2 className="text-lg font-black mb-4">Новая новость</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {([
          ['title', 'Заголовок *', 'text', true],
          ['slug', 'Slug (URL) *', 'text', true],
          ['description', 'Описание *', 'text', true],
          ['content', 'Контент (опционально)', 'text', false],
          ['image_url', 'URL изображения', 'text', false],
          ['model_slug', 'Slug модели', 'text', false],
          ['tags', 'Теги (через запятую)', 'text', false],
        ] as [keyof FormData, string, string, boolean][]).map(([field, label, type, req]) => (
          <div key={field} className={field === 'description' || field === 'content' ? 'md:col-span-2' : ''}>
            <label className="block text-xs font-bold mb-1 uppercase">{label}</label>
            {field === 'content' || field === 'description' ? (
              <textarea
                value={form[field]}
                onChange={e => set(field, e.target.value)}
                required={req}
                rows={3}
                className="w-full border-2 border-black dark:border-zinc-600 px-3 py-2 text-sm font-mono bg-white dark:bg-zinc-800"
              />
            ) : (
              <input
                type={type}
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
            {loading ? 'Сохранение...' : 'Создать'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="border-2 border-black font-bold px-4 py-2 hover:bg-gray-100 transition-all"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
