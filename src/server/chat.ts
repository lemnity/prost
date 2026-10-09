import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { exec, json, query, type Row } from "./db";
import { READ_MS, filesReply, openingMessages, ruleReply, typingMs } from "@/lib/chat/agent";
import { MAX_FILE_SIZE, MAX_FILES, type ChatFileMeta, type ChatMessage } from "@/lib/chat/types";
import type { CartItem } from "@/lib/cart/store";

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), ".uploads");

type MsgRow = Row & { id: number; role: ChatMessage["role"]; text: string; files: unknown; type_at: number | null; visible_at: number };

const toMsg = (r: MsgRow): ChatMessage => ({
  id: r.id,
  role: r.role,
  text: r.text,
  at: Number(r.visible_at),
  ...(r.type_at ? { typeAt: Number(r.type_at) } : {}),
  ...(r.files ? { files: json<ChatFileMeta[]>(r.files) } : {}),
});

export async function listMessages(number: string, afterId = 0): Promise<ChatMessage[]> {
  const rows = await query<MsgRow>("SELECT * FROM messages WHERE order_number = ? AND id > ? ORDER BY id LIMIT 500", [number, afterId]);
  return rows.map(toMsg);
}

async function insert(number: string, role: ChatMessage["role"], text: string, visibleAt: number, typeAt: number | null, files?: ChatFileMeta[]) {
  const r = await exec("INSERT INTO messages (order_number, role, text, files, type_at, visible_at) VALUES (?, ?, ?, ?, ?, ?)", [
    number,
    role,
    text,
    files?.length ? JSON.stringify(files) : null,
    typeAt,
    visibleAt,
  ]);
  return r.insertId;
}

/** Приветствие и разбор корзины сразу после оформления заявки. */
export async function openChat(order: { number: string; name: string; items: CartItem[]; total: number }) {
  for (const m of openingMessages(order)) await insert(order.number, "agent", m.text, m.at, m.typeAt);
}

async function lastVisibleAt(number: string): Promise<number> {
  const rows = await query<Row & { t: number | null }>("SELECT MAX(visible_at) AS t FROM messages WHERE order_number = ?", [number]);
  return Number(rows[0]?.t ?? 0);
}

/** Менеджер недавно отвечал сам — бот не вмешивается. */
async function managerActive(number: string): Promise<boolean> {
  const rows = await query<Row & { n: number }>(
    "SELECT COUNT(*) AS n FROM messages WHERE order_number = ? AND role = 'manager' AND created_at > (UTC_TIMESTAMP() - INTERVAL 30 MINUTE)",
    [number],
  );
  return Number(rows[0]?.n ?? 0) > 0;
}

export async function saveUploads(number: string, files: File[]): Promise<ChatFileMeta[]> {
  const list = files.filter((f) => f.size > 0).slice(0, MAX_FILES);
  if (!list.length) return [];
  await mkdir(UPLOAD_DIR, { recursive: true });
  const out: ChatFileMeta[] = [];
  for (const f of list) {
    if (f.size > MAX_FILE_SIZE) continue;
    const id = randomBytes(12).toString("hex");
    await writeFile(path.join(UPLOAD_DIR, id), Buffer.from(await f.arrayBuffer()));
    const name = (f.name || "файл").slice(0, 200);
    const mime = (f.type || "application/octet-stream").slice(0, 120);
    await exec("INSERT INTO files (id, order_number, name, size, mime) VALUES (?, ?, ?, ?, ?)", [id, number, name, f.size, mime]);
    out.push({ id, name, size: f.size, type: mime });
  }
  return out;
}

/** Сообщение клиента + (если менеджер не на связи) ответ бота с «живыми» паузами. */
export async function addUserMessage(number: string, text: string, files: ChatFileMeta[]): Promise<void> {
  const now = Date.now();
  await insert(number, "user", text, now, null, files);
  if (await managerActive(number)) return;
  let reply = text ? ruleReply(text) : "";
  if (files.length) reply = text && !/^Записала/.test(reply) ? `${reply}\n\n${filesReply(files)}` : filesReply(files);
  if (!reply) return;
  const typeAt = Math.max(now + READ_MS, (await lastVisibleAt(number)) + 1200);
  await insert(number, "agent", reply, typeAt + typingMs(reply), typeAt);
}

export async function addManagerMessage(number: string, text: string, files: ChatFileMeta[] = []): Promise<void> {
  await insert(number, "manager", text, Date.now(), null, files);
}
