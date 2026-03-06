'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  ImageIcon,
  Video,
  History,
  CreditCard,
  LogOut,
  Shield,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Обзор', icon: LayoutDashboard },
  { href: '/generate/image', label: 'Изображения', icon: ImageIcon },
  { href: '/generate/video', label: 'Видео', icon: Video },
  { href: '/history', label: 'История', icon: History },
  { href: '/billing', label: 'Баланс и оплата', icon: CreditCard },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <aside className="w-64 border-r min-h-screen flex flex-col p-4">
      <Link href="/dashboard" className="text-xl font-bold text-primary mb-8 block">
        AI Generator
      </Link>
      <nav className="flex-1 space-y-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
        {isAdmin && (
          <>
            <Separator className="my-2" />
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Shield className="h-4 w-4" />
              Админ панель
            </Link>
          </>
        )}
      </nav>
      <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 mt-4">
        <LogOut className="h-4 w-4" />
        Выйти
      </Button>
    </aside>
  );
}
