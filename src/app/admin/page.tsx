import { createServiceClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { kopecksToRubles } from '@/lib/utils/currency';
import { Users, ImageIcon, DollarSign, Activity } from 'lucide-react';
import type { Transaction } from '@/types/database';

export default async function AdminPage() {
  const admin = createServiceClient();

  const [
    { count: usersCount },
    { count: generationsCount },
    { data: revenueData },
    { count: completedCount },
  ] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('generations').select('id', { count: 'exact', head: true }),
    admin.from('transactions').select('amount_kopecks').eq('type', 'topup').eq('status', 'completed'),
    admin.from('generations').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
  ]);

  const transactions = (revenueData ?? []) as Pick<Transaction, 'amount_kopecks'>[];
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount_kopecks, 0);

  const stats = [
    { title: 'Пользователей', value: usersCount ?? 0, icon: Users },
    { title: 'Генераций', value: generationsCount ?? 0, icon: ImageIcon },
    { title: 'Успешных', value: completedCount ?? 0, icon: Activity },
    { title: 'Выручка', value: kopecksToRubles(totalRevenue), icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Статистика</h1>
        <p className="text-muted-foreground">Общий обзор платформы</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
