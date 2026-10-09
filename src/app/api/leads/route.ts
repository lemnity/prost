import { exec } from "@/server/db";
import { tooManyAttempts } from "@/server/auth";
import { clientIp, fail, ok, readJson, sameOrigin, str } from "@/server/http";
import { notifyManager } from "@/server/notify";

const KINDS = { brief: "Бриф на разработку", callback: "Обратный звонок", contact: "Сообщение с сайта" } as const;

/** Обращения с форм (бриф, обратный звонок): сохраняем и уведомляем менеджера. */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  if (tooManyAttempts(`lead:${await clientIp()}`)) return fail(429, "Слишком много обращений подряд, попробуйте позже");
  const body = await readJson<{ kind?: string; text?: string; data?: Record<string, unknown> }>(req);
  const kind = body?.kind && body.kind in KINDS ? (body.kind as keyof typeof KINDS) : null;
  const text = str(body?.text, 8000);
  if (!kind || !text) return fail(400, "Некорректный запрос");
  const data = Object.fromEntries(Object.entries(body?.data ?? {}).slice(0, 40).map(([k, v]) => [k.slice(0, 40), str(typeof v === "string" ? v : JSON.stringify(v), 2000)]));
  await exec("INSERT INTO leads (kind, data) VALUES (?, ?)", [kind, JSON.stringify({ ...data, text })]);
  void notifyManager(`${KINDS[kind]} с сайта`, text);
  return ok({ ok: true });
}
