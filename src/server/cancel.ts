import { createHmac, timingSafeEqual } from "node:crypto";

/** Подпись ссылки отмены заказа из письма (работает и для гостей, без входа). */
export function cancelToken(number: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET не задан");
  return createHmac("sha256", secret).update(`cancel:${number}`).digest("base64url").slice(0, 32);
}

export function checkCancelToken(number: string, t: string): boolean {
  const a = Buffer.from(cancelToken(number));
  const b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const cancelLink = (number: string) =>
  `${process.env.SITE_URL || "https://prostyle.agency"}/order/cancel?n=${encodeURIComponent(number)}&t=${cancelToken(number)}`;
