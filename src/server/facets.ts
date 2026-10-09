import { exec, json, query, type Row } from "./db";
import { facetsOf, type FacetKind } from "@/lib/catalog/facets";

/** Пересчёт меток фильтров (цвет, материал, нанесение) для всех товаров — после синхронизации каталога. */
export async function rebuildFacets(): Promise<number> {
  let after = "", total = 0;
  for (;;) {
    const rows = await query<Row & { id: string; colors: unknown; attributes: unknown }>(
      "SELECT p.id, p.colors, d.attributes FROM oc_products p LEFT JOIN oc_product_details d ON d.id = p.id WHERE p.deleted = 0 AND p.id > ? ORDER BY p.id LIMIT 2000",
      [after],
    );
    if (!rows.length) break;
    after = rows[rows.length - 1].id;
    const ids = rows.map((r) => r.id);
    const facets: [string, FacetKind, string][] = rows.flatMap((r) => {
      const colors = (json<{ name?: string }[]>(r.colors) ?? []).map((c) => c.name ?? "").filter(Boolean);
      const attrs = json<{ name: string; value: string }[]>(r.attributes) ?? [];
      return facetsOf(colors, attrs).map(([k, v]): [string, FacetKind, string] => [r.id, k, v]);
    });
    await exec("DELETE FROM oc_product_facets WHERE product_id IN (?)", [ids]);
    if (facets.length) await exec("INSERT IGNORE INTO oc_product_facets (product_id, kind, value) VALUES ?", [facets]);
    total += rows.length;
  }
  // Метки удалённых товаров не нужны.
  await exec("DELETE f FROM oc_product_facets f JOIN oc_products p ON p.id = f.product_id WHERE p.deleted = 1");
  return total;
}
