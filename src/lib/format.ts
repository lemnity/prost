const priceNumber = new Intl.NumberFormat("ru-RU");

/** Number with ru-RU grouping (NBSP) and currency sign, without the «от» prefix. */
export function formatPriceValue(value: number): string {
  return `${priceNumber.format(value)}\u00A0₽`;
}
