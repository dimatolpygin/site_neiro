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
    <Card>
      <CardHeader>
        <CardTitle>Генерация видео</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          <div className="space-y-2">
            <Label>Модель</Label>
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Label>Длительность (сек)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 секунды</SelectItem>
                <SelectItem value="5">5 секунд</SelectItem>
                <SelectItem value="8">8 секунд</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Промпт</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the video you want to generate..."
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
