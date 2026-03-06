import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Pricing } from '@/components/landing/Pricing';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            AI Generator
          </Link>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Войти</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Начать бесплатно</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container">
          <p>© 2025 AI Generator. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
