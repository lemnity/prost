import { json, query, type Row } from "@/server/db";
import { ok } from "@/server/http";

type Img = { big?: string; superbig?: string; small?: string };

/** Дерево разделов с количеством товаров и обложкой (для снимка src/data/oasis-tree.json). Обложка — из товара, для которого раздел основной. */
export async function GET() {
  const cats = await query<Row & { id: number; parent_id: number | null; root: number | null; level: number; slug: string; name: string; product_count: number; sort: number }>(
    "SELECT id, parent_id, root, level, slug, name, product_count, sort FROM oc_categories ORDER BY sort",
  );
  const covers = await query<Row & { category_id: number; images: unknown }>(
    `SELECT category_id, images FROM (
       SELECT pc.category_id, p.images,
         ROW_NUMBER() OVER (PARTITION BY pc.category_id ORDER BY (c.id IN (own.id, own.parent_id, up.parent_id)) DESC, (p.stock + p.remote > 0) DESC, p.rating DESC, p.id) rn
       FROM oc_product_categories pc JOIN oc_products p ON p.id = pc.product_id AND p.deleted = 0
       JOIN oc_categories c ON c.id = pc.category_id AND c.level <= 3
       LEFT JOIN oc_categories own ON own.id = p.primary_cat
       LEFT JOIN oc_categories up ON up.id = own.parent_id
     ) x WHERE rn = 1`,
  );
  const cover = new Map(covers.map((c) => [c.category_id, json<Img[]>(c.images)?.[0]?.big ?? ""]));
  return ok(
    {
      generatedAt: new Date().toISOString(),
      categories: cats.map((c) => ({ id: c.id, parent: c.parent_id, root: c.root, level: c.level, slug: c.slug, name: c.name, count: c.product_count, image: cover.get(c.id) ?? "" })),
    },
    { headers: { "Cache-Control": "public, max-age=600" } },
  );
}
