'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setError(error.message === 'User already registered' ? 'Email уже зарегистрирован' : error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFE600]">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_#000] rounded-none">
        <div className="p-8 border-b-4 border-black text-center">
          <Link href="/" className="text-2xl font-black uppercase tracking-tight text-black mb-2 block">
            ИИ Генератор
          </Link>
          <h1 className="text-xl font-black uppercase tracking-tight text-black">Создать аккаунт</h1>
          <p className="text-sm font-medium text-black/60 mt-1">Зарегистрируйтесь и начните генерировать</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-4">
            {error && (
              <div className="text-sm font-bold text-white bg-[#FF2D78] border-2 border-black p-3">{error}</div>
            )}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-xs font-black uppercase tracking-wide text-black">Имя</label>
              <input
                id="fullName"
                type="text"
                placeholder="Ваше имя"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black rounded-none focus:outline-none focus:border-[#FF2D78] font-medium"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-black uppercase tracking-wide text-black">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border-2 border-black rounded-none focus:outline-none focus:border-[#FF2D78] font-medium"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs font-black uppercase tracking-wide text-black">Пароль</label>
              <input
                id="password"
                type="password"
                placeholder="Минимум 8 символов"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border-2 border-black rounded-none focus:outline-none focus:border-[#FF2D78] font-medium"
              />
            </div>
          </div>
          <div className="px-8 pb-8 flex flex-col gap-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-black uppercase tracking-wide text-sm bg-black text-white border-2 border-black shadow-[4px_4px_0px_#FF2D78] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0"
            >
              {loading ? 'Регистрация...' : 'Создать аккаунт'}
            </button>
            <p className="text-sm font-medium text-center text-black">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="font-black underline hover:text-[#FF2D78] transition-colors">
                Войти
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
