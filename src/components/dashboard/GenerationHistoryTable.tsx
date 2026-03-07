'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Generation } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { kopecksToRubles } from '@/lib/utils/currency';
import { Download, ImageIcon, Video } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  pending: { label: 'Ожидание', variant: 'secondary' },
  processing: { label: 'Обработка', variant: 'warning' },
  completed: { label: 'Готово', variant: 'success' },
  failed: { label: 'Ошибка', variant: 'destructive' },
};

interface GenerationHistoryTableProps {
  generations: Generation[];
}

export function GenerationHistoryTable({ generations }: GenerationHistoryTableProps) {
  const router = useRouter();
  const hasPending = generations.some(g => g.status === 'pending' || g.status === 'processing');

  useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [hasPending, router]);

  if (generations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>Пока нет генераций</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {generations.map(gen => {
        const status = STATUS_MAP[gen.status] ?? STATUS_MAP.pending;
        return (
          <div
            key={gen.id}
            className="flex items-center gap-4 p-4 border rounded-lg bg-card"
          >
            <div className="shrink-0">
              {gen.type === 'image' ? (
                gen.result_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={gen.result_url}
                    alt={gen.prompt}
                    className="h-14 w-14 rounded object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded bg-muted flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )
              ) : (
                <div className="h-14 w-14 rounded bg-muted flex items-center justify-center">
                  <Video className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{gen.prompt}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(gen.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                {' · '}
                {kopecksToRubles(gen.cost_kopecks)}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <Badge variant={status.variant as 'default'}>{status.label}</Badge>
              {gen.result_url && (
                <Button variant="ghost" size="icon" asChild>
                  <a href={gen.result_url} download target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
