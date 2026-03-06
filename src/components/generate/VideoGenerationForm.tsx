'use client';

import { useState } from 'react';
import type { ModelPricing } from '@/types/database';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GenerationStatusPoller } from './GenerationStatusPoller';
import { kopecksToRubles } from '@/lib/utils/currency';
import { Loader2 } from 'lucide-react';

interface VideoGenerationFormProps {
  models: ModelPricing[];
}

export function VideoGenerationForm({ models }: VideoGenerationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [modelId, setModelId] = useState(models[0]?.model_id ?? '');
  const [duration, setDuration] = useState('5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generationId, setGenerationId] = useState<string | null>(null);

  const selectedModel = models.find(m => m.model_id === modelId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setGenerationId(null);

    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelId, prompt, duration: parseInt(duration) }),
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
    return <GenerationStatusPoller generationId={generationId} type="video" onReset={() => setGenerationId(null)} />;
  }

  return (
    <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] rounded-none">
      <div className="p-6 border-b-2 border-black">
        <h2 className="text-xl font-black uppercase tracking-tight text-black">Генерация видео</h2>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-sm font-bold text-white bg-[#FF2D78] border-2 border-black p-3">{error}</div>
          )}

          <div className="space-y-2">
            <Label className="font-bold uppercase text-xs tracking-wide">Модель</Label>
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger className="border-2 border-black rounded-none focus:ring-0 focus:border-[#00E5A0]">
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
            <Label className="font-bold uppercase text-xs tracking-wide">Длительность (сек)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="border-2 border-black rounded-none focus:ring-0 focus:border-[#00E5A0]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-2 border-black rounded-none">
                <SelectItem value="3">3 секунды</SelectItem>
                <SelectItem value="5">5 секунд</SelectItem>
                <SelectItem value="8">8 секунд</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt" className="font-bold uppercase text-xs tracking-wide">Промпт</Label>
            <Textarea
              id="prompt"
              placeholder="Опишите видео, которое хотите создать..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              required
              className="border-2 border-black rounded-none focus:ring-0 focus:border-[#00E5A0] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full py-3 font-black uppercase tracking-wide text-sm bg-[#00E5A0] text-black border-2 border-black shadow-[4px_4px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0"
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
