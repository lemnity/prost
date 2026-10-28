import type { NextRequest } from "next/server";
import { listProducts, rowByArticle, toProduct } from "@/server/catalog";
import { catsByText } from "@/lib/catalog/oasis-tree";
import { clientIp, fail, ok } from "@/server/http";

const hits = new Map<string, number[]>();
/** Подсказки летят на каждый набранный символ: не больше 300 запросов за 10 минут с одного адреса. */
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 600_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 300;
}

/** Подсказки поля поиска: ?q= → { items (до 5 товаров), cats (до 3 разделов), total }. */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return ok({ items: [], cats: [], total: 0 });
  if (limited(await clientIp())) return fail(429, "Слишком много запросов");
  // Похоже на артикул (без пробелов, есть цифра) — точное совпадение показываем первым.
  const article = !/\s/.test(q) && /\d/.test(q) ? rowByArticle(q).catch(() => null) : Promise.resolve(null);
  try {
    const [list, exact] = await Promise.all([listProducts({ q, perPage: 5 }), article]);
    const first = exact ? toProduct(exact) : null;
    const items = first ? [first, ...list.items.filter((p) => p.id !== first.id && p.sku !== first.sku)].slice(0, 5) : list.items;
    return ok(
      { items, cats: catsByText(q), total: Math.max(list.total, items.length), exact: !!first },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("suggest:", (e as Error).message);
    return fail(502, "Поиск временно недоступен");
  }
}
