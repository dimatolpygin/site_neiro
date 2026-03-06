'use client';

import { useBalance } from '@/hooks/useBalance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TopUpModal } from '@/components/billing/TopUpModal';
import { kopecksToRubles } from '@/lib/utils/currency';
import { Wallet } from 'lucide-react';

export function BalanceCard() {
  const { balance, isLoading } = useBalance();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Баланс</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-4">
          {isLoading ? '...' : kopecksToRubles(balance ?? 0)}
        </div>
        <TopUpModal>
          <Button size="sm" className="w-full">Пополнить</Button>
        </TopUpModal>
      </CardContent>
    </Card>
  );
}
