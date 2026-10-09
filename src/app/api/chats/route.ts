import { query, type Row } from "@/server/db";
import { currentUser, guestHash } from "@/server/auth";
import { ok } from "@/server/http";
import { toChatInfo } from "@/server/chat-info";
import type { OrderRow } from "@/server/orders";

/** Список чатов (по заявкам) текущего пользователя или гостя. */
export async function GET() {
  const user = await currentUser();
  const guest = user ? null : await guestHash(false);
  if (!user && !guest) return ok({ chats: [] });
  const rows = user
    ? await query<OrderRow & Row>("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 50", [user.id])
    : await query<OrderRow & Row>("SELECT * FROM orders WHERE guest_hash = ? ORDER BY id DESC LIMIT 50", [guest]);
  return ok({ chats: rows.map((r) => toChatInfo(r, user)) }, { headers: { "Cache-Control": "no-store" } });
}
