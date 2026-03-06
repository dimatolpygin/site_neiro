'use client';

import { useState } from 'react';
import useSWR from 'swr';
import type { PricingPlan } from '@/types/database';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { kopecksToRubles } from '@/lib/utils/currency';
import { Loader2, Check } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface TopUpModalProps {
  children: React.ReactNode;
}

export function TopUpModal({ children }: TopUpModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: plans } = useSWR<PricingPlan[]>(
    open ? '/api/billing/plans' : null,
    fetcher
  );

  async function handleTopUp() {
    if (!selectedPlan) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/billing/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Ошибка создания платежа');
        return;
      }

      window.location.href = data.confirmationUrl;
    } catch {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Пополнение баланса</DialogTitle>
          <DialogDescription>Выберите пакет пополнения. Оплата картой через ЮKassa.</DialogDescription>
        </DialogHeader>

        {!plans ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {plans.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors text-left ${
                  selectedPlan === plan.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div>
                  <div className="font-medium">{plan.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {kopecksToRubles(plan.topup_kopecks)} на баланс
                    {plan.bonus_kopecks > 0 && (
                      <Badge variant="success" className="ml-2 text-xs">
                        +{kopecksToRubles(plan.bonus_kopecks)} бонус
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{kopecksToRubles(plan.topup_kopecks)}</span>
                  {selectedPlan === plan.id && <Check className="h-4 w-4 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleTopUp} disabled={!selectedPlan || loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Переход к оплате...
            </>
          ) : (
            'Перейти к оплате'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
