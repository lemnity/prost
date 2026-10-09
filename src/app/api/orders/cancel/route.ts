import { exec } from "@/server/db";
import { fail, ok, readJson, sameOrigin, str } from "@/server/http";
import { getOrderRow } from "@/server/orders";
import { checkCancelToken } from "@/server/cancel";
import { notifyManager } from "@/server/notify";

/** Отмена заказа по ссылке из письма «Ваш заказ». */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  const body = await readJson<{ number?: string; token?: string }>(req);
  const number = str(body?.number, 32);
  if (!number || !checkCancelToken(number, str(body?.token, 64))) return fail(403, "Ссылка недействительна");
  const row = await getOrderRow(number);
  if (!row) return fail(404, "Заказ не найден");
  if (row.status === "cancelled") return ok({ status: "cancelled", already: true });
  if (row.status === "done") return fail(409, "Заказ уже выполнен — отменить его нельзя. Свяжитесь с менеджером.");
  await exec("UPDATE orders SET status = 'cancelled' WHERE number = ?", [number]);
  void notifyManager(`Клиент отменил заказ ${number}`, `Заказ ${number} отменён по ссылке из письма.\n\nАдминка: ${process.env.SITE_URL ?? ""}/admin?order=${number}`);
  return ok({ status: "cancelled" });
}

/** Статус заказа для страницы отмены (без персональных данных). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const number = str(u.searchParams.get("n"), 32);
  if (!number || !checkCancelToken(number, str(u.searchParams.get("t"), 64))) return fail(403, "Ссылка недействительна");
  const row = await getOrderRow(number);
  if (!row) return fail(404, "Заказ не найден");
  return ok({ number, status: row.status, total: Number(row.total) }, { headers: { "Cache-Control": "no-store" } });
}
