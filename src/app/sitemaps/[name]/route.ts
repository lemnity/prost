import { cached, categoryEntries, pageEntries, productEntries, urlset } from "@/server/sitemap";

export const dynamic = "force-dynamic";

/** Часть карты сайта: pages.xml, catalog.xml, products-<N>.xml. */
export async function GET(_req: Request, ctx: RouteContext<"/sitemaps/[name]">) {
  const { name } = await ctx.params;
  const m = /^(pages|catalog|products-(\d{1,3}))\.xml$/.exec(name);
  if (!m) return new Response("Not found", { status: 404 });
  const xml = await cached(name, async () => {
    if (m[1] === "pages") return urlset(pageEntries());
    if (m[1] === "catalog") return urlset(categoryEntries());
    const entries = await productEntries(Number(m[2]) - 1);
    if (!entries.length) throw new Error("empty");
    return urlset(entries);
  }).catch(() => null);
  if (!xml) return new Response("Not found", { status: 404 });
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
