import { readFile } from "node:fs/promises";
import path from "node:path";
import { query, type Row } from "@/server/db";
import { fail } from "@/server/http";
import { UPLOAD_DIR } from "@/server/chat";
import { IMAGE_TYPES, SITE_FILES } from "@/server/site";

/** Картинки баннеров и новостей, загруженные в админке, — публично. Вложения заявок здесь не отдаются. */
export async function GET(_req: Request, ctx: RouteContext<"/media/[id]">) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{24}$/.test(id)) return fail(404, "Файл не найден");
  const [f] = await query<Row & { mime: string }>("SELECT mime FROM files WHERE id = ? AND order_number = ?", [id, SITE_FILES]);
  if (!f || !IMAGE_TYPES.includes(f.mime)) return fail(404, "Файл не найден");
  try {
    const data = await readFile(path.join(UPLOAD_DIR, id));
    return new Response(data, {
      headers: {
        "Content-Type": f.mime,
        // Адрес не меняется: новая картинка — новый id.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return fail(404, "Файл не найден");
  }
}
