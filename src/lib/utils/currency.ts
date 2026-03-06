export function kopecksToRubles(kopecks: number): string {
  const rubles = kopecks / 100;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rubles);
}

export function rublesStringToKopecks(rubles: string): number {
  return Math.round(parseFloat(rubles) * 100);
}
