import { Zap, Shield, CreditCard, Image, Video, BarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Image,
    title: 'Генерация изображений',
    description: 'Создавайте фотореалистичные изображения с FLUX моделями. Поддержка HD разрешений.',
  },
  {
    icon: Video,
    title: 'Генерация видео',
    description: 'Создавайте видео 480p и 720p из текстового описания с помощью Wan T2V.',
  },
  {
    icon: Zap,
    title: 'Быстрая обработка',
    description: 'Асинхронная очередь заданий — вы видите статус генерации в реальном времени.',
  },
  {
    icon: CreditCard,
    title: 'Оплата картой РФ',
    description: 'Пополнение баланса через ЮKassa. Visa, Mastercard, Мир — без ограничений.',
  },
  {
    icon: Shield,
    title: 'Безопасность',
    description: 'Аутентификация, Rate limiting, RLS политики — ваши данные и средства защищены.',
  },
  {
    icon: BarChart,
    title: 'История генераций',
    description: 'Полная история всех генераций с результатами. Скачивайте в любой момент.',
  },
];

export function Features() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Всё что нужно для создания контента</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Профессиональные инструменты AI-генерации с простым управлением и прозрачной тарификацией
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border bg-background">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
