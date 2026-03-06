import Link from 'next/link';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Старт',
    price: '500',
    bonus: null,
    description: 'Для знакомства с платформой',
    features: ['500 ₽ на баланс', 'Изображения от 5 ₽', 'Видео от 50 ₽', 'История генераций'],
    badge: null,
    popular: false,
  },
  {
    name: 'Базовый',
    price: '1500',
    bonus: '100',
    description: 'Для регулярных пользователей',
    features: ['1500 ₽ на баланс', '+100 ₽ бонус', 'Всё из Старт', 'Приоритетная очередь'],
    badge: 'Популярный',
    popular: true,
  },
  {
    name: 'Про',
    price: '5000',
    bonus: '500',
    description: 'Для интенсивного использования',
    features: ['5000 ₽ на баланс', '+500 ₽ бонус', 'Всё из Базового', 'API доступ (скоро)'],
    badge: 'Лучшая цена',
    popular: false,
  },
];

export function Pricing() {
  return (
    <section className="py-20 bg-[#FFFDF5] border-b-4 border-black">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-black">
            Простые цены
          </h2>
          <p className="text-lg font-medium max-w-2xl mx-auto text-black">
            Пополняйте баланс удобным пакетом и тратьте на любые генерации. Деньги не сгорают.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col border-2 border-black rounded-none ${
                plan.popular
                  ? 'bg-[#FFE600] shadow-[6px_6px_0px_#000]'
                  : 'bg-white shadow-[4px_4px_0px_#000]'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF2D78] text-white border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wide whitespace-nowrap">
                  {plan.badge}
                </div>
              )}
              <div className="p-6 border-b-2 border-black">
                <h3 className="text-xl font-black uppercase tracking-tight text-black">{plan.name}</h3>
                <p className="text-sm font-medium text-black/70 mt-1">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-6xl font-black text-black">{plan.price}</span>
                  <span className="text-xl font-bold text-black">₽</span>
                  {plan.bonus && (
                    <span className="text-sm font-black text-black bg-[#00E5A0] border border-black px-2 py-0.5">
                      +{plan.bonus} ₽
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6 flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm font-medium text-black">
                      <Check className="h-4 w-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 pt-0">
                <Link
                  href="/register"
                  className="block w-full text-center py-3 font-black uppercase tracking-wide text-sm bg-black text-white border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                >
                  Выбрать
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12 text-sm font-medium text-black/60">
          <p>Тарификация: изображение FLUX Dev — 5 ₽, FLUX Dev HD — 8 ₽, Видео 480p — 50 ₽, Видео 720p — 100 ₽</p>
        </div>
      </div>
    </section>
  );
}
