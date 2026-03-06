'use client';

import { useState } from 'react';
import type { ModelPricing } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card>
      <CardHeader>
        <CardTitle>Генерация изображения</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="model">Модель</Label>
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map(m => (
                  <SelectItem key={m.model_id} value={m.model_id}>
                    {m.display_name} — {kopecksToRubles(m.cost_kopecks)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Размер</Label>
            <Select value={sizeKey} onValueChange={setSizeKey}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZE_OPTIONS.map(s => (
                  <SelectItem key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Промпт</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              required
            />
          </div>

          <Button type="submit" disabled={loading || !prompt.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Отправка...
              </>
            ) : (
              `Сгенерировать за ${selectedModel ? kopecksToRubles(selectedModel.cost_kopecks) : '...'}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
