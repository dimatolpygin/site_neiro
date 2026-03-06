'use client';

import { useGenerationStatus } from '@/hooks/useGenerationStatus';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface GenerationStatusPollerProps {
  generationId: string;
  type: 'image' | 'video';
  onReset: () => void;
}

export function GenerationStatusPoller({ generationId, type, onReset }: GenerationStatusPollerProps) {
  const { status, resultUrl, errorMessage } = useGenerationStatus(generationId);

  const isProcessing = status === 'pending' || status === 'processing';

  return (
    <Card className="mt-6">
      <CardContent className="py-6">
        {isProcessing && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {status === 'pending' ? 'Ожидание в очереди...' : 'Генерация...'}
            </p>
            <Progress value={status === 'processing' ? 60 : 20} className="w-full max-w-xs" />
          </div>
        )}

        {status === 'completed' && resultUrl && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Готово!</span>
            </div>
            {type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resultUrl}
                alt="Результат генерации"
                className="rounded-lg w-full max-h-96 object-contain"
              />
            ) : (
              <video src={resultUrl} controls className="rounded-lg w-full max-h-96" />
            )}
            <div className="flex gap-3">
              <Button asChild>
                <a href={resultUrl} download target="_blank" rel="noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Скачать
                </a>
              </Button>
              <Button variant="outline" onClick={onReset}>
                Создать ещё
              </Button>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Ошибка генерации</span>
            </div>
            {errorMessage && <p className="text-sm text-muted-foreground">{errorMessage}</p>}
            <Button variant="outline" onClick={onReset}>Попробовать снова</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
