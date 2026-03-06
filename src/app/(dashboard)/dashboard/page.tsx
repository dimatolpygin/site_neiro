import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { GenerationHistoryTable } from '@/components/dashboard/GenerationHistoryTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ImageIcon, Video } from 'lucide-react';
import type { Generation } from '@/types/database';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: genData } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: statsData } = await supabase
    .from('generations')
    .select('status')
    .eq('user_id', user.id);

  const recentGenerations = (genData ?? []) as Generation[];
  const stats = (statsData ?? []) as Pick<Generation, 'status'>[];

  const totalCount = stats.length;
  const completedCount = stats.filter(g => g.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Обзор</h1>
        <p className="text-muted-foreground">Добро пожаловать в AI Generator</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BalanceCard />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Генераций всего</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Успешных</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-dashed hover:border-primary transition-colors">
          <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
            <ImageIcon className="h-10 w-10 text-primary" />
            <p className="font-medium">Создать изображение</p>
            <Button asChild>
              <Link href="/generate/image">Открыть</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-dashed hover:border-primary transition-colors">
          <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
            <Video className="h-10 w-10 text-primary" />
            <p className="font-medium">Создать видео</p>
            <Button asChild>
              <Link href="/generate/video">Открыть</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {recentGenerations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Последние генерации</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/history">Все →</Link>
            </Button>
          </div>
          <GenerationHistoryTable generations={recentGenerations} />
        </div>
      )}
    </div>
  );
}
