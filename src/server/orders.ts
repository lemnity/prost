import { exec, json, query, type Row } from "./db";
import type { CartItem } from "@/lib/cart/store";
import type { SavedOrder, OrderStatus } from "@/lib/account/store";
import { getProductByUrl } from "@/lib/catalog/products";
import { liveByArticles, normArticle } from "./oasis";

type OrderRow = Row & {
  number: string;
  user_id: number | null;
  guest_hash: string | null;
  contact: unknown;
  items: unknown;
  total: string;
  delivery: string;
  payment: string;
  address: string | null;
  comment: string | null;
  promo: string | null;
  order_text: string;
  status: OrderStatus;
  created_at: Date;
};

export type OrderContact = { name: string; phone: string; email: string; company: string; inn: string };

export const toSaved = (r: OrderRow): SavedOrder => ({
  number: r.number,
  status: r.status,
  date: new Date(r.created_at).toISOString(),
  total: Number(r.total),
  items: json<CartItem[]>(r.items),
  delivery: r.delivery,
  payment: r.payment,
  ...(r.address ? { address: r.address } : {}),
});

export type AdminOrder = SavedOrder & { contact: OrderContact; comment: string; promo: string; orderText: string; userId: number | null };

export const toAdmin = (r: OrderRow): AdminOrder => ({
  ...toSaved(r),
  contact: json<OrderContact>(r.contact),
  comment: r.comment ?? "",
  promo: r.promo ?? "",
  orderText: r.order_text,
  userId: r.user_id,
});

/** Цены — со склада Oasis (живые) или из каталога; клиентским ценам не доверяем. Распродажа недели — по цене акции. */
export async function priceItems(items: CartItem[]): Promise<CartItem[]> {
  const live = await liveByArticles(items.map((i) => String(i.sku ?? ""))).catch(() => ({}) as Awaited<ReturnType<typeof liveByArticles>>);
  return items.slice(0, 200).map((i) => {
    const p = typeof i.url === "string" ? getProductByUrl(i.url) : null;
    const qty = Math.min(99999, Math.max(1, Math.floor(Number(i.qty)) || 1));
    const base = {
      id: String(i.id).slice(0, 120),
      sku: String(i.sku ?? "").slice(0, 60),
      title: String(i.title ?? "").slice(0, 300),
      image: String(i.image ?? "").slice(0, 500),
      url: String(i.url ?? "").slice(0, 500),
      qty,
      ...(i.preorder ? { preorder: true } : {}),
    };
    const l = live[normArticle(base.sku)];
    if (p?.oldPrice && p.oldPrice > p.price) return { ...base, price: p.price, oldPrice: p.oldPrice };
    if (l && l.price > 0) return { ...base, price: l.price };
    if (p) return { ...base, price: p.price };
    const price = Math.max(0, Number(i.price) || 0);
    return { ...base, price, ...(i.oldPrice && Number(i.oldPrice) > price ? { oldPrice: Number(i.oldPrice) } : {}) };
  });
}

export async function nextOrderNumber(): Promise<string> {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const prefix = `PS-${p(d.getUTCFullYear() % 100)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}`;
  // Номер — от максимального за день (не от количества: после удаления заявок номера не совпадут).
  const rows = await query<Row & { n: number | null }>(
    "SELECT MAX(CAST(SUBSTRING_INDEX(number, '-', -1) AS UNSIGNED)) AS n FROM orders WHERE number LIKE ?",
    [`${prefix}-%`],
  );
  return `${prefix}-${String(Number(rows[0]?.n ?? 0) + 1).padStart(3, "0")}`;
}

export async function insertOrder(o: {
  number: string;
  userId: number | null;
  guestHash: string | null;
  contact: OrderContact;
  items: CartItem[];
  total: number;
  delivery: string;
  payment: string;
  address: string;
  comment: string;
  promo: string;
  orderText: string;
}) {
  await exec(
    `INSERT INTO orders (number, user_id, guest_hash, contact, items, total, delivery, payment, address, comment, promo, order_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [o.number, o.userId, o.guestHash, JSON.stringify(o.contact), JSON.stringify(o.items), o.total, o.delivery, o.payment, o.address || null, o.comment || null, o.promo || null, o.orderText],
  );
}

export async function ordersOf(userId: number): Promise<SavedOrder[]> {
  const rows = await query<OrderRow>("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 200", [userId]);
  return rows.map(toSaved);
}

export async function getOrderRow(number: string): Promise<OrderRow | null> {
  const rows = await query<OrderRow>("SELECT * FROM orders WHERE number = ? LIMIT 1", [number]);
  return rows[0] ?? null;
}

/** Доступ к заявке: владелец-пользователь, гость по cookie или админ. */
export function canAccess(r: OrderRow, user: { id: number; role: string } | null, guest: string | null): boolean {
  if (user?.role === "admin") return true;
  if (user && r.user_id === user.id) return true;
  return !!guest && r.guest_hash === guest;
}

export type { OrderRow };
