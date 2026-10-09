import { getCatalogTree } from "@/lib/catalog";
import { catByName, resolveCat } from "@/lib/catalog/oasis-tree";
import type { MenuData } from "@/lib/catalog/menu";
import { productsOfDay } from "@/server/catalog";

// «Товар дня» берётся из базы на сутки, поэтому меню собирается при запросе (браузер кэширует на час).
export const dynamic = "force-dynamic";

export async function GET() {
  const tree = await getCatalogTree();
  const ids = new Map(tree.map((c) => [c.id, (resolveCat(c.id) ?? catByName(c.title))?.id]));
  const picks = await productsOfDay([...ids.values()].filter((v): v is number => !!v)).catch(() => ({}) as Awaited<ReturnType<typeof productsOfDay>>);
  const potd: MenuData["potd"] = {};
  for (const c of tree) {
    const id = ids.get(c.id);
    const p = id ? picks[id] : undefined;
    if (p) potd[c.id] = p;
  }
  return Response.json({ tree, potd } satisfies MenuData, { headers: { "Cache-Control": "public, max-age=3600" } });
}
