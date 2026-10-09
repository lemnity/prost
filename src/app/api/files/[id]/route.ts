import { readFile } from "node:fs/promises";
import path from "node:path";
import { query, type Row } from "@/server/db";
import { currentUser, guestHash } from "@/server/auth";
import { fail } from "@/server/http";
import { canAccess, getOrderRow } from "@/server/orders";
import { UPLOAD_DIR } from "@/server/chat";

/** Вложение чата — только владельцу заявки и админу. */
export async function GET(_req: Request, ctx: RouteContext<"/api/files/[id]">) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{24}$/.test(id)) return fail(404, "Файл не найден");
  const [f] = await query<Row & { order_number: string; name: string; mime: string }>("SELECT * FROM files WHERE id = ?", [id]);
  if (!f) return fail(404, "Файл не найден");
  const row = await getOrderRow(f.order_number);
  const user = await currentUser();
  if (!row || !canAccess(row, user, user ? null : await guestHash(false))) return fail(404, "Файл не найден");
  try {
    const data = await readFile(path.join(UPLOAD_DIR, id));
    const inline = f.mime.startsWith("image/") && !f.mime.includes("svg");
    return new Response(data, {
      headers: {
        "Content-Type": inline ? f.mime : "application/octet-stream",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(f.name)}`,
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return fail(404, "Файл не найден");
  }
}
