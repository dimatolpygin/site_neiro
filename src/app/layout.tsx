import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Генератор — изображения и видео',
  description: 'Генерируйте изображения и видео с помощью ИИ. Быстро, качественно, доступно.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
