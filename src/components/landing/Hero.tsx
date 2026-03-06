import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ImageIcon, Video } from 'lucide-react';

export function Hero() {
  return (
    <section className="py-24 md:py-32">
      <div className="container flex flex-col items-center text-center gap-8">
        <div className="rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
          Новинка: генерация видео доступна
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
          Создавайте{' '}
          <span className="text-primary">потрясающие изображения</span>{' '}
          и видео с помощью ИИ
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          Профессиональный AI-генератор для создателей контента. Пополните баланс
          картой и начните генерировать прямо сейчас — без подписки.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Button size="lg" asChild>
            <Link href="/register">
              Начать бесплатно
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Войти в аккаунт</Link>
          </Button>
        </div>
        <div className="flex gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            Изображения от 5 руб.
          </div>
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            Видео от 50 руб.
          </div>
        </div>
      </div>
    </section>
  );
}
