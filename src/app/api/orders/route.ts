import { currentUser, guestHash, tooManyAttempts } from "@/server/auth";
import { clientIp, fail, ok, readJson, sameOrigin, str } from "@/server/http";
import { insertOrder, nextOrderNumber, priceItems } from "@/server/orders";
import { openChat } from "@/server/chat";
import { notifyManager } from "@/server/notify";
import { buildOrder, deliveryLabel, paymentLabel, type Delivery, type OrderData, type Payment } from "@/lib/cart/order-text";
import { cartTotal, type CartItem } from "@/lib/cart/store";
import { greetName } from "@/lib/account/store";

const DELIVERY: Delivery[] = ["pickup", "courier", "region"];
const PAYMENT: Payment[] = ["invoice", "card", "cash"];

/** Оформление заявки: сохраняем, открываем чат с менеджером, уведомляем. */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  if (tooManyAttempts(`order:${await clientIp()}`)) return fail(429, "Слишком много заявок подряд, попробуйте позже");
  const body = await readJson<{ data?: Record<string, unknown>; items?: CartItem[]; promo?: string }>(req);
  const d = body?.data;
  if (!d || !Array.isArray(body?.items) || !body.items.length) return fail(400, "Корзина пуста");

  const data: OrderData = {
    name: str(d.name, 120),
    phone: str(d.phone, 32),
    email: str(d.email, 190),
    company: str(d.company, 200),
    inn: str(d.inn, 12).replace(/\D/g, ""),
    delivery: DELIVERY.includes(d.delivery as Delivery) ? (d.delivery as Delivery) : "pickup",
    city: str(d.city, 120),
    address: str(d.address, 300),
    payment: PAYMENT.includes(d.payment as Payment) ? (d.payment as Payment) : "invoice",
    comment: str(d.comment, 2000),
  };
  if (!data.name || !data.phone) return fail(400, "Укажите имя и телефон");

  const items = priceItems(body.items);
  const total = Math.round(cartTotal(items) * 100) / 100;
  const promo = str(body.promo, 32).toUpperCase();
  const user = await currentUser();
  const guest = user ? null : await guestHash(true);
  const number = await nextOrderNumber();
  const { text } = buildOrder(items, data, promo);
  const address = data.delivery === "pickup" ? "" : [data.delivery === "region" ? data.city : "", data.address].filter(Boolean).join(", ");

  await insertOrder({
    number,
    userId: user?.id ?? null,
    guestHash: guest,
    contact: { name: data.name, phone: data.phone, email: data.email, company: data.company, inn: data.inn },
    items,
    total,
    delivery: deliveryLabel[data.delivery],
    payment: paymentLabel[data.payment],
    address,
    comment: data.comment,
    promo,
    orderText: text,
  });
  await openChat({ number, name: user ? greetName(user.profile) : data.name.split(/\s+/)[0], items, total });
  void notifyManager(`Новая заявка ${number} — ${data.company || data.name}`, `${text}\n\nАдминка: ${process.env.SITE_URL ?? ""}/admin?order=${number}`);
  return ok({ number });
}
