import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Profile } from '@/types/database';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  const profile = data as Profile | null;

  return (
    <div className="flex min-h-screen">
      <Sidebar isAdmin={profile?.is_admin} />
      <div className="flex-1 flex flex-col">
        <header className="border-b h-16 flex items-center justify-end px-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
