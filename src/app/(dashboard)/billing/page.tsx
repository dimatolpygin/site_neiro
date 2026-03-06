import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { kopecksToRubles } from '@/lib/utils/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TopUpModal } from '@/components/billing/TopUpModal';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Profile, Transaction } from '@/types/database';

const TX_STATUS_MAP: Record<string, string> = {
  pending: 'Ожидание',
  completed: 'Выполнено',
  failed: 'Ошибка',
  cancelled: 'Отменено',
};

const TX_TYPE_MAP: Record<string, string> = {
  topup: 'Пополнение',
  deduction: 'Списание',
  refund: 'Возврат',
};

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profileData }, { data: txData }] = await Promise.all([
    supabase.from('profiles').select('balance').eq('id', user.id).single(),
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const profile = profileData as Profile | null;
  const transactions = (txData ?? []) as Transaction[];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Баланс и оплата</h1>
        <p className="text-muted-foreground">История транзакций и пополнение баланса</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Текущий баланс</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-3xl font-bold">{kopecksToRubles(profile?.balance ?? 0)}</span>
          <TopUpModal>
            <Button>Пополнить</Button>
          </TopUpModal>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">История транзакций</h2>
        {!transactions.length ? (
          <p className="text-muted-foreground text-sm">Транзакций пока нет</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{TX_TYPE_MAP[tx.type] ?? tx.type}</div>
                  <div className="text-sm text-muted-foreground">
                    {tx.description ?? ''}
                    {' · '}
                    {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={tx.status === 'completed' ? 'success' : tx.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs">
                    {TX_STATUS_MAP[tx.status] ?? tx.status}
                  </Badge>
                  <span className={`font-bold ${tx.type === 'deduction' ? 'text-destructive' : 'text-green-500'}`}>
                    {tx.type === 'deduction' ? '-' : '+'}{kopecksToRubles(tx.amount_kopecks)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
