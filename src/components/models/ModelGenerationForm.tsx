'use client';

import { useState, useMemo, useRef } from 'react';
import type { Model, ModelQuality } from '@/types/database';
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
  const [selectedQuality, setSelectedQuality] = useState(model.available_quality[0]?.value ?? '');
  const [selectedDuration, setSelectedDuration] = useState(model.available_durations[0]?.value ?? 5);
  const [sound, setSound] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generationId, setGenerationId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAspectRatioModel = model.endpoint.includes('nano-banana') || model.endpoint.includes('seedance');
  const isSizeStringModel = model.endpoint.includes('flux-2-max') || model.endpoint.includes('gpt-image-1.5') || model.endpoint.includes('seedream');
  const hasSound = model.endpoint.includes('kling-video-o3-pro');

  const currentCost = useMemo(() => {
    if (selectedQuality && model.available_quality.length > 0) {
      const q = model.available_quality.find((item: ModelQuality) => item.value === selectedQuality);
      if (q?.cost_kopecks) return q.cost_kopecks;
    }
    return model.cost_kopecks;
  }, [selectedQuality, model]);

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
      const body: Record<string, unknown> = { model: model.endpoint, prompt };

      // Size / aspect_ratio
      if (isAspectRatioModel) {
        if (selectedSize) body.aspect_ratio = selectedSize;
      } else if (isSizeStringModel) {
        if (selectedSize) body.size = selectedSize;
      } else if (selectedSize) {
        const [w, h] = selectedSize.split('*').map(Number);
        if (w && h) { body.width = w; body.height = h; }
      }

      // Duration (video)
      if (model.available_durations.length > 0) body.duration = selectedDuration;

      // Quality
      if (selectedQuality) body.quality = selectedQuality;

      // Sound (kling-video-o3-pro)
      if (hasSound) body.sound = sound;

      // Image input
      if (model.supports_image_input && imageUrl) body.image_url = imageUrl;

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
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Левая колонка — форма (всегда видна) */}
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
                      {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
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

            {/* Size / aspect_ratio selector */}
            {model.available_sizes.length > 0 && (
              <div className="space-y-2">
                <label className="block font-bold uppercase text-xs tracking-wide">
                  {isAspectRatioModel ? 'Соотношение сторон' : 'Размер'}
                </label>
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

            {/* Duration selector */}
            {model.available_durations.length > 0 && (
              <div className="space-y-2">
                <label className="block font-bold uppercase text-xs tracking-wide">Длительность</label>
                <div className="flex flex-wrap gap-2">
                  {model.available_durations.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setSelectedDuration(d.value)}
                      className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black transition-all ${
                        selectedDuration === d.value
                          ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000]'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quality selector */}
            {model.available_quality.length > 0 && (
              <div className="space-y-2">
                <label className="block font-bold uppercase text-xs tracking-wide">Качество</label>
                <div className="flex flex-wrap gap-2">
                  {model.available_quality.map(q => (
                    <button
                      key={q.value}
                      type="button"
                      onClick={() => setSelectedQuality(q.value)}
                      className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black transition-all ${
                        selectedQuality === q.value
                          ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000]'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {q.label}{q.cost_kopecks ? ` — ${kopecksToRubles(q.cost_kopecks)}` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sound toggle */}
            {hasSound && (
              <div className="space-y-2">
                <label className="block font-bold uppercase text-xs tracking-wide">Звук</label>
                <button
                  type="button"
                  onClick={() => setSound(s => !s)}
                  className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black transition-all ${
                    sound ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000]' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {sound ? 'Включён' : 'Выключен'}
                </button>
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
                `Создать за ${kopecksToRubles(currentCost)}`
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Правая колонка — результат или placeholder */}
      <div className="border-2 border-black shadow-[6px_6px_0px_#000] min-h-[400px] flex flex-col">
        {generationId ? (
          <GenerationStatusPoller
            generationId={generationId}
            type={model.type === 'video' ? 'video' : 'image'}
            onReset={handleReset}
          />
        ) : (
          <div className="flex items-center justify-center flex-1 p-8 text-center">
            <div>
              <div className="text-4xl mb-4 opacity-20">✦</div>
              <p className="font-black uppercase text-sm tracking-wide text-gray-500">Результат появится здесь</p>
              <p className="text-xs mt-1 text-gray-400">Заполните форму и нажмите Создать</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
