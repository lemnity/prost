import { exec, json } from "@/server/db";
import { requireAdmin } from "@/server/admin";
import { fail, ok, readJson } from "@/server/http";
import { sendMail } from "@/server/notify";
import { shippedEmail } from "@/server/emails";
import { parseShipping, type Shipping } from "@/lib/shipping";
import { clientName, getOrderRow, toAdmin, type OrderContact } from "@/server/orders";
import { listMessages } from "@/server/chat";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/orders/[number]">) {
  const a = await requireAdmin();
  if (a instanceof Response) return a;
  const { number } = await ctx.params;
  const row = await getOrderRow(number);
  if (!row) return fail(404, "Заявка не найдена");
  return ok({ order: toAdmin(row), messages: await listMessages(number), now: Date.now() }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/orders/[number]">) {
  const a = await requireAdmin(true);
  if (a instanceof Response) return a;
  const { number } = await ctx.params;
  const body = await readJson<{ status?: string; shipping?: unknown }>(req);
  if (body?.shipping !== undefined) return saveShipping(number, body.shipping);
  const status = ["new", "work", "done", "cancelled"].includes(body?.status ?? "") ? body!.status : null;
  if (!status) return fail(400, "Некорректный статус");
  await exec("UPDATE orders SET status = ? WHERE number = ?", [status, number]);
  return ok({ ok: true });
}

/** Этап доставки и трек-номер. При переходе в «Отправлен» клиенту уходит письмо со ссылкой на отслеживание. */
async function saveShipping(number: string, raw: unknown) {
  const data = parseShipping(raw);
  if (!data) return fail(400, "Некорректные данные доставки");
  const row = await getOrderRow(number);
  if (!row) return fail(404, "Заявка не найдена");
  const prev = row.shipping ? json<Shipping>(row.shipping) : null;
  const shipping: Shipping = { ...data, updatedAt: new Date().toISOString() };
  await exec("UPDATE orders SET shipping = ? WHERE number = ?", [JSON.stringify(shipping), number]);
  const contact = json<OrderContact>(row.contact);
  if (shipping.stage === "shipped" && prev?.stage !== "shipped" && contact.email) {
    const site = process.env.SITE_URL || "https://prostyle.agency";
    const mail = shippedEmail({ number, name: await clientName(row.user_id, contact.name), shipping, orderLink: `${site}/account` });
    void sendMail({ to: contact.email, ...mail });
  }
  return ok({ shipping });
}
