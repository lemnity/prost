import { currentUser, guestHash, tooManyAttempts } from "@/server/auth";
import { fail, ok, sameOrigin, str } from "@/server/http";
import { canAccess, getOrderRow } from "@/server/orders";
import { addUserMessage, listMessages, saveUploads } from "@/server/chat";
import { toChatInfo } from "@/server/chat-info";
import { notifyManager } from "@/server/notify";

async function access(number: string) {
  const row = await getOrderRow(number);
  const user = await currentUser();
  const guest = user ? null : await guestHash(false);
  return row && canAccess(row, user, guest) ? { row, user } : null;
}

/** Сообщения чата (after — id последнего полученного). */
export async function GET(req: Request, ctx: RouteContext<"/api/chat/[number]">) {
  const { number } = await ctx.params;
  const a = await access(number);
  if (!a) return fail(404, "Чат не найден");
  const after = Number(new URL(req.url).searchParams.get("after") || 0) || 0;
  return ok(
    { chat: toChatInfo(a.row, a.user), messages: await listMessages(number, after), now: Date.now() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Сообщение клиента: multipart (text, files[]). */
export async function POST(req: Request, ctx: RouteContext<"/api/chat/[number]">) {
  if (!(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  const { number } = await ctx.params;
  const a = await access(number);
  if (!a) return fail(404, "Чат не найден");
  if (tooManyAttempts(`chat:${number}`)) return fail(429, "Слишком много сообщений подряд");
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "Некорректный запрос");
  }
  const text = str(form.get("text"), 2000);
  const files = await saveUploads(number, form.getAll("files").filter((f): f is File => f instanceof File));
  if (!text && !files.length) return fail(400, "Пустое сообщение");
  await addUserMessage(number, text, files);
  void notifyManager(
    `Сообщение в чате ${number}`,
    `${text || "(без текста)"}${files.length ? `\nФайлы: ${files.map((f) => f.name).join(", ")}` : ""}\n\nОтветить: ${process.env.SITE_URL ?? ""}/admin?order=${number}`,
  );
  return ok({ ok: true });
}
