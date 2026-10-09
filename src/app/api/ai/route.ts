import { answer, type ChatTurn } from "@/server/ai";
import { clientIp, fail, ok, readJson, sameOrigin } from "@/server/http";

const hits = new Map<string, number[]>();
/** Не больше 30 сообщений за 10 минут с одного адреса. */
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 600_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 30;
}

/** ИИ-помощник поиска: { messages: [{ role, content }] } → { reply, products, ai }. */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return fail(403, "Запрос с чужого сайта");
  if (limited(await clientIp())) return fail(429, "Слишком много сообщений — попробуйте через несколько минут");
  const body = await readJson<{ messages?: unknown }>(req);
  const history: ChatTurn[] = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m): m is ChatTurn => !!m && typeof m === "object" && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 1000) }))
    .filter((m) => m.content);
  if (!history.length || history[history.length - 1].role !== "user") return fail(400, "Напишите вопрос");
  try {
    return ok(await answer(history));
  } catch (e) {
    console.error("ai:", (e as Error).message);
    return fail(502, "Помощник временно недоступен — попробуйте обычный поиск или позвоните нам");
  }
}
