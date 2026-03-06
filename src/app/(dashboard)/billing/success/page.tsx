'use client';

import { useEffect, useState } from 'react';
import { useBalance } from '@/hooks/useBalance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { kopecksToRubles } from '@/lib/utils/currency';
import Link from 'next/link';

export default function BillingSuccessPage() {
  const { balance, isLoading, mutate } = useBalance();
  const [attempts, setAttempts] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (confirmed) return;
    if (attempts >= 5) {
      setConfirmed(true);
      return;
    }

    const timer = setTimeout(() => {
      mutate();
      setAttempts(a => a + 1);
    }, 2000);

    return () => clearTimeout(timer);
  }, [attempts, confirmed, mutate]);

  useEffect(() => {
    if (!isLoading && balance !== undefined && balance > 0) {
      setConfirmed(true);
    }
  }, [balance, isLoading]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Оплата прошла!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!confirmed ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Обновление баланса...
            </div>
          ) : (
            <div className="text-lg">
              Ваш баланс:{' '}
              <span className="font-bold text-primary">
                {kopecksToRubles(balance ?? 0)}
              </span>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/generate/image">Начать генерацию</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Обзор</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
