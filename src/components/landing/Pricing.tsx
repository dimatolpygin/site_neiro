import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Старт',
    price: '500',
    balance: '500',
    bonus: null,
    description: 'Для знакомства с платформой',
    features: ['500 ₽ на баланс', 'Изображения от 5 ₽', 'Видео от 50 ₽', 'История генераций'],
    badge: null,
  },
  {
    name: 'Базовый',
    price: '1500',
    balance: '1500',
    bonus: '100',
    description: 'Для регулярных пользователей',
    features: ['1500 ₽ на баланс', '+100 ₽ бонус', 'Всё из Старт', 'Приоритетная очередь'],
    badge: 'Популярный',
  },
  {
    name: 'Про',
    price: '5000',
    balance: '5000',
    bonus: '500',
    description: 'Для интенсивного использования',
    features: ['5000 ₽ на баланс', '+500 ₽ бонус', 'Всё из Базового', 'API доступ (скоро)'],
    badge: 'Лучшая цена',
  },
];

export function Pricing() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Простые и понятные цены</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Пополняйте баланс удобным пакетом и тратьте на любые генерации. Деньги не сгорают.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.badge === 'Популярный' ? 'border-primary shadow-lg' : ''}`}>
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant={plan.badge === 'Популярный' ? 'default' : 'secondary'}>
                  {plan.badge}
                </Badge>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-2">
                  <span className="text-4xl font-bold">{plan.price} ₽</span>
                  {plan.bonus && (
                    <span className="ml-2 text-sm text-green-500 font-medium">+{plan.bonus} ₽ бонус</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.badge === 'Популярный' ? 'default' : 'outline'} asChild>
                  <Link href="/register">Выбрать</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Тарификация: изображение FLUX Dev — 5 ₽, FLUX Dev HD — 8 ₽, Видео 480p — 50 ₽, Видео 720p — 100 ₽</p>
        </div>
      </div>
    </section>
  );
}
