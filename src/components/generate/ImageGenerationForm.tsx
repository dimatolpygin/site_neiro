'use client';

import { useState } from 'react';
import type { ModelPricing } from '@/types/database';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GenerationStatusPoller } from './GenerationStatusPoller';
import { kopecksToRubles } from '@/lib/utils/currency';
import { Loader2 } from 'lucide-react';

interface ImageGenerationFormProps {
  models: ModelPricing[];
}

const SIZE_OPTIONS = [
  { label: '1024×1024 (квадрат)', width: 1024, height: 1024 },
  { label: '1280×720 (16:9)', width: 1280, height: 720 },
  { label: '720×1280 (9:16)', width: 720, height: 1280 },
  { label: '1024×768 (4:3)', width: 1024, height: 768 },
];

export function ImageGenerationForm({ models }: ImageGenerationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [modelId, setModelId] = useState(models[0]?.model_id ?? '');
  const [sizeKey, setSizeKey] = useState('1024x1024');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generationId, setGenerationId] = useState<string | null>(null);

  const selectedModel = models.find(m => m.model_id === modelId);
  const selectedSize = SIZE_OPTIONS.find(s => `${s.width}x${s.height}` === sizeKey) ?? SIZE_OPTIONS[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setGenerationId(null);

    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          prompt,
          width: selectedSize.width,
          height: selectedSize.height,
        }),
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

  if (generationId) {
    return <GenerationStatusPoller generationId={generationId} type="image" onReset={() => setGenerationId(null)} />;
  }

  return (
    <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] rounded-none">
      <div className="p-6 border-b-2 border-black">
        <h2 className="text-xl font-black uppercase tracking-tight text-black">Генерация изображения</h2>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-sm font-bold text-white bg-[#FF2D78] border-2 border-black p-3">{error}</div>
          )}

          <div className="space-y-2">
            <Label className="font-bold uppercase text-xs tracking-wide">Модель</Label>
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger className="border-2 border-black rounded-none focus:ring-0 focus:border-[#FF2D78]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-2 border-black rounded-none">
                {models.map(m => (
                  <SelectItem key={m.model_id} value={m.model_id}>
                    {m.display_name} — {kopecksToRubles(m.cost_kopecks)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-bold uppercase text-xs tracking-wide">Размер</Label>
            <Select value={sizeKey} onValueChange={setSizeKey}>
              <SelectTrigger className="border-2 border-black rounded-none focus:ring-0 focus:border-[#FF2D78]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-2 border-black rounded-none">
                {SIZE_OPTIONS.map(s => (
                  <SelectItem key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt" className="font-bold uppercase text-xs tracking-wide">Промпт</Label>
            <Textarea
              id="prompt"
              placeholder="Опишите изображение, которое хотите создать..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              required
              className="border-2 border-black rounded-none focus:ring-0 focus:border-[#FF2D78] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full py-3 font-black uppercase tracking-wide text-sm bg-[#FF2D78] text-white border-2 border-black shadow-[4px_4px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Отправка...
              </span>
            ) : (
              `Сгенерировать за ${selectedModel ? kopecksToRubles(selectedModel.cost_kopecks) : '...'}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
