const priceNumber = new Intl.NumberFormat("ru-RU");

/** Number with ru-RU grouping (NBSP) and currency sign, without the «от» prefix. */
export function formatPriceValue(value: number): string {
  return `${priceNumber.format(value)} ₽`;
}

export function formatPrice(value: number): string {
  return `от ${formatPriceValue(value)}`;
}
