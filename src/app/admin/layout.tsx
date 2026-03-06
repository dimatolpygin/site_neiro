import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, BarChart } from 'lucide-react';
import type { Profile } from '@/types/database';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  const profile = data as Profile | null;
  if (!profile?.is_admin) redirect('/dashboard');

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r min-h-screen flex flex-col p-4">
        <div className="mb-8">
          <Link href="/admin" className="text-xl font-bold text-primary block mb-1">
            AI Generator
          </Link>
          <span className="text-xs text-muted-foreground">Панель администратора</span>
        </div>
        <nav className="flex-1 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent">
            <BarChart className="h-4 w-4" />
            Статистика
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent">
            <Users className="h-4 w-4" />
            Пользователи
          </Link>
        </nav>
        <Button variant="ghost" className="w-full justify-start gap-3 mt-4" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Вернуться
          </Link>
        </Button>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="border-b h-16 flex items-center justify-end px-6">
          <ThemeToggle />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
