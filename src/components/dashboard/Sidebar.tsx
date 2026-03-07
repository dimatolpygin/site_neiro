'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  History,
  CreditCard,
  LogOut,
  Shield,
  Store,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Обзор', icon: LayoutDashboard },
  { href: '/models', label: 'Маркетплейс', icon: Store },
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
    <aside className="w-64 border-r-4 border-black min-h-screen flex flex-col p-4 bg-[#FFFDF5]">
      <Link href="/dashboard" className="text-xl font-black uppercase tracking-tight text-black mb-8 block">
        ИИ Генератор
      </Link>
      <nav className="flex-1 space-y-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm font-bold transition-all',
              pathname === item.href
                ? 'bg-[#FFE600] border-2 border-black shadow-[3px_3px_0px_#000] text-black'
                : 'text-black hover:bg-white hover:border-2 hover:border-black'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
        {isAdmin && (
          <>
            <div className="border-t-2 border-black my-2" />
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-bold transition-all',
                pathname.startsWith('/admin')
                  ? 'bg-[#FFE600] border-2 border-black shadow-[3px_3px_0px_#000] text-black'
                  : 'text-black hover:bg-white hover:border-2 hover:border-black'
              )}
            >
              <Shield className="h-4 w-4 shrink-0" />
              Админ панель
            </Link>
          </>
        )}
      </nav>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 text-sm font-bold border-2 border-black mt-4 hover:bg-[#FF2D78] hover:text-white transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Выйти
      </button>
    </aside>
  );
}
