import sharp from "sharp";
import { IMAGE_WIDTHS } from "@/lib/image-widths";

/**
 * Конвертер фото товаров в WebP: GET /api/img?w=<ширина>&src=<адрес фото склада>.
 * Ответ кэшируется nginx (proxy_cache «imgs»), так что каждое фото конвертируется один раз.
 * Источники — только склады: Oasis (s.a-5.ru) и gifts.ru (files.gifts.ru / наш прокси /gifts-img/).
 */
const ALLOWED = [/^https:\/\/s\.a-5\.ru\//, /^https:\/\/files\.gifts\.ru\/reviewer\//, /^https:\/\/prostyle\.gifts\/content\//];
const MAX_BYTES = 15 * 1024 * 1024;

sharp.concurrency(1); // слабый сервер: один поток libvips
let active = 0;
const queue: (() => void)[] = [];
/** Не больше двух конвертаций одновременно — остальные ждут. */
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= 2) await new Promise<void>((r) => queue.push(r));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    queue.shift()?.();
  }
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  let src = q.get("src") ?? "";
  if (src.startsWith("/gifts-img/")) src = `https://files.gifts.ru/reviewer/${src.slice("/gifts-img/".length)}`;
  const w = Number(q.get("w"));
  if (!ALLOWED.some((re) => re.test(src)) || !IMAGE_WIDTHS.includes(w)) return new Response("Bad request", { status: 400 });
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(15_000), cache: "no-store" });
    if (!res.ok) return new Response("Not found", { status: res.status === 404 ? 404 : 502 });
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) return Response.redirect(src, 302);
    const webp = await slot(() => sharp(buf).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 78, effort: 3 }).toBuffer());
    return new Response(new Uint8Array(webp), {
      headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    // Не удалось сконвертировать — пусть браузер возьмёт оригинал.
    return Response.redirect(src, 302);
  }
}
