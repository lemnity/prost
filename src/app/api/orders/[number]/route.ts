import { exec } from "@/server/db";
import { currentUser } from "@/server/auth";
import { fail, ok, readJson, sameOrigin } from "@/server/http";
import { getOrderRow } from "@/server/orders";
import { notifyManager } from "@/server/notify";

/** Клиент отмечает заявку: «получена» или «отменена». */
export async function PATCH(req: Request, ctx: RouteContext<"/api/orders/[number]">) {
  if (!(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  const user = await currentUser();
  if (!user) return fail(401, "Войдите в кабинет");
  const { number } = await ctx.params;
  const row = await getOrderRow(number);
  if (!row || row.user_id !== user.id) return fail(404, "Заявка не найдена");
  const body = await readJson<{ status?: string }>(req);
  const status = body?.status === "done" || body?.status === "cancelled" ? body.status : null;
  if (!status) return fail(400, "Некорректный статус");
  await exec("UPDATE orders SET status = ? WHERE number = ?", [status, number]);
  if (status === "cancelled") void notifyManager(`Клиент отменил заявку ${number}`, `Заявку ${number} отменили в личном кабинете.`);
  return ok({ ok: true });
}
