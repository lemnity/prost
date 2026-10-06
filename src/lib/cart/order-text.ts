import { site } from "@/content/site";
import { formatPriceValue } from "@/lib/format";
import { cartDiscount, cartTotal, type CartItem } from "./store";

export const MAILTO_LIMIT = 1800;

export type Delivery = "pickup" | "courier" | "region";
export type Payment = "invoice" | "card" | "cash";

export type OrderData = {
  name: string;
  phone: string;
  email: string;
  company: string;
  inn: string;
  delivery: Delivery;
  city: string;
  address: string;
  payment: Payment;
  comment: string;
};

export const deliveryLabel: Record<Delivery, string> = {
  pickup: "Самовывоз из офиса",
  courier: "Курьером по Тюмени",
  region: "В регионы России",
};
export const paymentLabel: Record<Payment, string> = {
  invoice: "Безналичный расчёт",
  card: "Банковской картой",
  cash: "Наличными",
};

const opt = (label: string, val: string) => (val ? [`${label}: ${val}`] : []);

function deliveryLines(d: OrderData): string[] {
  const lines = [`Получение: ${deliveryLabel[d.delivery]}`];
  if (d.delivery === "pickup") lines.push(`Адрес офиса: ${site.address}`);
  if (d.delivery === "region") lines.push(`Город: ${d.city}`);
  if (d.delivery !== "pickup") lines.push(`Адрес доставки: ${d.address}`);
  return lines;
}

export type BuiltOrder = {
  /** Полный текст (с \n) — для показа и копирования. */
  text: string;
  /** mailto-ссылка или null, если даже сокращённая не помещается. */
  href: string | null;
};

export function buildOrder(items: readonly CartItem[], d: OrderData, promo = ""): BuiltOrder {
  const total = cartTotal(items);
  const discount = cartDiscount(items);
  const build = (lines: string[], comment: string, sep: string) =>
    [
      "Контакты:",
      `Имя: ${d.name}`,
      `Телефон: ${d.phone}`,
      ...opt("Email", d.email),
      ...opt("Компания", d.company),
      ...opt("ИНН", d.inn),
      "",
      ...deliveryLines(d),
      `Оплата: ${paymentLabel[d.payment]}`,
      "",
      "Состав заказа:",
      ...lines,
      "",
      ...(discount > 0 ? [`Скидка: \u2212${formatPriceValue(discount)}`] : []),
      `Итого: от ${formatPriceValue(total)}`,
      ...opt("Промокод", promo),
      ...(comment ? ["", `Комментарий: ${comment}`] : []),
    ].join(sep);
  const url = (body: string) =>
    `mailto:${site.email}?subject=${encodeURIComponent("Заказ с сайта ProStyle")}&body=${encodeURIComponent(body)}`;

  const fullLines = items.map(
    (i) => `${i.title}${i.preorder ? " (под заказ)" : ""} — ${i.sku} — ${i.qty} шт × ${formatPriceValue(i.price)} = ${formatPriceValue(i.qty * i.price)}`,
  );
  const text = build(fullLines, d.comment, "\n");
  let href: string | null = url(build(fullLines, d.comment, "\r\n"));
  if (href.length > MAILTO_LIMIT) {
    const compact = items.map((i) => `арт. ${i.sku} × ${i.qty} шт = ${formatPriceValue(i.qty * i.price)}`);
    const mk = (c: string) => url(build(compact, c, "\r\n"));
    if (mk("").length <= MAILTO_LIMIT) {
      let c = d.comment;
      while (c && mk(c).length > MAILTO_LIMIT) c = c.slice(0, Math.max(0, c.length - 10));
      href = mk(c);
    } else {
      href = null;
    }
  }
  return { text, href };
}

/** Номер заявки PS-ГГММДД-ЧЧММ по времени клиента. */
export function orderNumber(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `PS-${p(now.getFullYear() % 100)}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}`;
}
