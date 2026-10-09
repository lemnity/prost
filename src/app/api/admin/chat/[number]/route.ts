import { requireAdmin } from "@/server/admin";
import { fail, ok, str } from "@/server/http";
import { getOrderRow } from "@/server/orders";
import { addManagerMessage, saveUploads } from "@/server/chat";

/** Ответ менеджера в чате заявки (multipart: text, files[]). */
export async function POST(req: Request, ctx: RouteContext<"/api/admin/chat/[number]">) {
  const a = await requireAdmin(true);
  if (a instanceof Response) return a;
  const { number } = await ctx.params;
  if (!(await getOrderRow(number))) return fail(404, "Заявка не найдена");
  const form = await req.formData();
  const text = str(form.get("text"), 4000);
  const files = await saveUploads(number, form.getAll("files").filter((f): f is File => f instanceof File));
  if (!text && !files.length) return fail(400, "Пустое сообщение");
  await addManagerMessage(number, text, files);
  return ok({ ok: true });
}
