import { cached, productFiles, sitemapIndex } from "@/server/sitemap";

export const dynamic = "force-dynamic";

/** Индекс карты сайта: страницы, разделы каталога и товары (по частям). */
export async function GET() {
  const xml = await cached("index", async () => {
    const n = await productFiles();
    return sitemapIndex(["pages", "catalog", ...Array.from({ length: n }, (_, i) => `products-${i + 1}`)]);
  });
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
