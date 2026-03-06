import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Pricing } from '@/components/landing/Pricing';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      <header className="sticky top-0 z-50 bg-[#FFFDF5] border-b-4 border-black">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-black uppercase tracking-tight text-black">
            ИИ Генератор
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-bold border-2 border-black bg-white shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-bold border-2 border-black bg-black text-white shadow-[3px_3px_0px_#FF2D78] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform"
            >
              Начать бесплатно
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>
      <footer className="border-t-4 border-black py-8 text-center text-sm font-medium bg-[#FFFDF5]">
        <div className="container flex flex-col items-center gap-3">
          <p>© 2025 ИИ Генератор. Все права защищены.</p>
          <div className="flex items-center gap-2">
            <span>Связаться с автором:</span>
            <a
              href="https://kwork.ru/user/anastasia9919"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 text-sm font-bold border-2 border-black bg-[#FF2D78] text-white shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform inline-block"
            >
              Kwork
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
