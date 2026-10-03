const priceNumber = new Intl.NumberFormat("ru-RU");

export function formatPrice(value: number): string {
  return `от ${priceNumber.format(value)} ₽`;
}
