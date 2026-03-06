import { Zap, Shield, CreditCard, Image, Video, BarChart } from 'lucide-react';

const features = [
  {
    icon: Image,
    title: 'Генерация изображений',
    description: 'Создавайте фотореалистичные изображения с FLUX моделями. Поддержка HD разрешений.',
    accent: '#FFE600',
  },
  {
    icon: Video,
    title: 'Генерация видео',
    description: 'Создавайте видео 480p и 720p из текстового описания с помощью Wan T2V.',
    accent: '#00E5A0',
  },
  {
    icon: Zap,
    title: 'Быстрая обработка',
    description: 'Асинхронная очередь заданий — вы видите статус генерации в реальном времени.',
    accent: '#B4A0FF',
  },
  {
    icon: CreditCard,
    title: 'Оплата картой РФ',
    description: 'Пополнение баланса через ЮKassa. Visa, Mastercard, Мир — без ограничений.',
    accent: '#FF2D78',
  },
  {
    icon: Shield,
    title: 'Безопасность',
    description: 'Аутентификация, ограничение запросов, политики RLS — ваши данные и средства защищены.',
    accent: '#FFE600',
  },
  {
    icon: BarChart,
    title: 'История генераций',
    description: 'Полная история всех генераций с результатами. Скачивайте в любой момент.',
    accent: '#00E5A0',
  },
];

export function Features() {
  return (
    <section className="py-20 bg-[#FFFDF5] border-b-4 border-black">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-black">
            Всё для создания контента
          </h2>
          <p className="text-lg font-medium max-w-2xl mx-auto text-black">
            Профессиональные инструменты генерации с простым управлением и прозрачной тарификацией
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-none p-6 hover:-translate-y-1 hover:shadow-[4px_8px_0px_#000] transition-all"
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 border-2 border-black mb-4"
                style={{ backgroundColor: feature.accent }}
              >
                <feature.icon className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight mb-2 text-black">{feature.title}</h3>
              <p className="text-sm font-medium text-black/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
