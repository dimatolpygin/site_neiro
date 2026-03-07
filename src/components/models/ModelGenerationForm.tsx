'use client';

import { useState, useRef } from 'react';
import type { Model } from '@/types/database';
import { kopecksToRubles } from '@/lib/utils/currency';
import { GenerationStatusPoller } from '@/components/generate/GenerationStatusPoller';
import { Loader2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ModelGenerationFormProps {
  model: Model;
}

export function ModelGenerationForm({ model }: ModelGenerationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedSize, setSelectedSize] = useState(model.available_sizes[0]?.value ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generationId, setGenerationId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('generation-images')
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('generation-images').getPublicUrl(fileName);
      setImageUrl(data.publicUrl);
    } catch {
      setError('Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (model.supports_image_input && !imageUrl) {
      setError('Загрузите изображение');
      return;
    }

    setLoading(true);
    setError('');
    setGenerationId(null);

    try {
      const apiPath = model.type === 'video' ? '/api/generate/video' : '/api/generate/image';

      const body: Record<string, unknown> = {
        model: model.endpoint,
        prompt,
      };

      if (model.type === 'video') {
        body.duration = 5;
      } else if (selectedSize) {
        const [w, h] = selectedSize.split('*').map(Number);
        if (w && h) { body.width = w; body.height = h; }
      }

      if (model.supports_image_input && imageUrl) {
        body.image_url = imageUrl;
      }

      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) setError('Недостаточно средств. Пополните баланс.');
        else if (res.status === 429) setError('Слишком много запросов. Подождите минуту.');
        else setError(data.error ?? 'Ошибка генерации');
        return;
      }

      setGenerationId(data.generationId);
    } catch {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setGenerationId(null);
    setPrompt('');
    setImageUrl(null);
  }

  if (generationId) {
    return (
      <GenerationStatusPoller
        generationId={generationId}
        type={model.type === 'video' ? 'video' : 'image'}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000]">
      <div className="p-6 border-b-2 border-black">
        <h2 className="text-xl font-black uppercase tracking-tight">Параметры генерации</h2>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-sm font-bold text-white bg-[#FF2D78] border-2 border-black p-3">{error}</div>
          )}

          {/* Image upload */}
          {model.supports_image_input && (
            <div className="space-y-2">
              <label className="block font-bold uppercase text-xs tracking-wide">Исходное изображение *</label>
              <div
                className="border-2 border-dashed border-black p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="Загружено" className="max-h-48 mx-auto object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8" />
                    )}
                    <span className="text-sm font-bold">
                      {uploading ? 'Загрузка...' : 'Нажмите или перетащите файл'}
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="text-xs font-bold underline text-gray-500 hover:text-black"
                >
                  Удалить изображение
                </button>
              )}
            </div>
          )}

          {/* Size selector */}
          {model.available_sizes.length > 0 && (
            <div className="space-y-2">
              <label className="block font-bold uppercase text-xs tracking-wide">Размер</label>
              <div className="flex flex-wrap gap-2">
                {model.available_sizes.map(size => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => setSelectedSize(size.value)}
                    className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black transition-all ${
                      selectedSize === size.value
                        ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000]'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prompt */}
          <div className="space-y-2">
            <label htmlFor="prompt" className="block font-bold uppercase text-xs tracking-wide">Промпт</label>
            <textarea
              id="prompt"
              placeholder="Опишите что нужно сгенерировать или изменить..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              maxLength={2000}
              required
              className="w-full border-2 border-black p-3 text-sm resize-none focus:outline-none focus:border-[#FF2D78] font-medium"
            />
            <div className="text-xs text-gray-400 text-right">{prompt.length}/2000</div>
          </div>

          {/* Templates */}
          {model.templates.length > 0 && (
            <div className="space-y-2">
              <label className="block font-bold uppercase text-xs tracking-wide">Шаблоны</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {model.templates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(tpl)}
                    className="text-left text-xs font-medium px-3 py-2 border-2 border-black hover:bg-[#FFE600] transition-colors truncate"
                    title={tpl}
                  >
                    {tpl}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !prompt.trim() || uploading}
            className="w-full py-3 font-black uppercase tracking-wide text-sm bg-[#FF2D78] text-white border-2 border-black shadow-[4px_4px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Отправка...
              </span>
            ) : (
              `Создать за ${kopecksToRubles(model.cost_kopecks)}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
