import Link from 'next/link';
import { ArrowRight, ImageIcon, Video } from 'lucide-react';

export function Hero() {
  return (
    <section className="bg-[#FFE600] border-b-4 border-black py-20 md:py-28">
      <div className="container flex flex-col items-center text-center gap-8">
        <div className="inline-block bg-[#FF2D78] text-white border-2 border-black shadow-[3px_3px_0px_#000] px-4 py-1.5 text-sm font-bold uppercase tracking-wide">
          Новинка: генерация видео доступна
        </div>
        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tight max-w-4xl leading-none text-black">
          Создавайте потрясающий контент с помощью ИИ
        </h1>
        <p className="text-lg md:text-xl font-medium max-w-2xl text-black">
          Профессиональный генератор для создателей контента. Пополните баланс
          картой и начните генерировать прямо сейчас — без подписки.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/register"
            className="flex items-center gap-2 px-6 py-3 text-base font-bold bg-black text-white border-2 border-black shadow-[4px_4px_0px_#FF2D78] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform uppercase"
          >
            Начать бесплатно
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 px-6 py-3 text-base font-bold bg-white text-black border-2 border-black shadow-[4px_4px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform uppercase"
          >
            Войти в аккаунт
          </Link>
        </div>
        <div className="flex gap-8 text-sm font-bold text-black">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Изображения от 5 руб.
          </div>
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Видео от 50 руб.
          </div>
        </div>
      </div>
    </section>
  );
}
