import { getCatalogTree, getProductOfDay } from "@/lib/catalog";
import type { MenuData } from "@/lib/catalog/menu";

export const dynamic = "force-static";

export async function GET() {
  const tree = await getCatalogTree();
  const potd: MenuData["potd"] = {};
  for (const c of tree) {
    const p = await getProductOfDay(c.id);
    if (p) potd[c.id] = { title: p.title, image: p.image, url: p.url, priceFrom: p.priceFrom };
  }
  return Response.json({ tree, potd } satisfies MenuData);
}
