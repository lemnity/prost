import { query, type Row } from "./db";
import { urlOf, type OcRow } from "./catalog";
import { categoryPages } from "@/lib/catalog/oasis-tree";
import { COLLECTIONS } from "./catalog-routes";
import { applications } from "@/content/home";
import news from "@/content/news.json";

/** Карта сайта для поисковиков: индекс /sitemap.xml и части /sitemaps/<имя>.xml (товары — по 10 000 моделей). */
export const SITE = (process.env.SITE_URL || "https://prostyle.agency").replace(/\/$/, "");
export const PRODUCTS_PER_FILE = 10_000;

type Entry = { loc: string; lastmod?: Date | string | null; changefreq?: string; priority?: number; image?: string | null };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : undefined);

export function urlset(entries: Entry[]): string {
  const body = entries
    .map((e) => {
      const parts = [`<loc>${esc(e.loc.startsWith("http") ? e.loc : SITE + e.loc)}</loc>`];
      const lm = iso(e.lastmod);
      if (lm) parts.push(`<lastmod>${lm}</lastmod>`);
      if (e.changefreq) parts.push(`<changefreq>${e.changefreq}</changefreq>`);
      if (e.priority != null) parts.push(`<priority>${e.priority.toFixed(1)}</priority>`);
      if (e.image) parts.push(`<image:image><image:loc>${esc(e.image)}</image:loc></image:image>`);
      return `<url>${parts.join("")}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
}

export function sitemapIndex(names: string[]): string {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${names
    .map((n) => `<sitemap><loc>${SITE}/sitemaps/${n}.xml</loc><lastmod>${now}</lastmod></sitemap>`)
    .join("\n")}\n</sitemapindex>\n`;
}

/** Основные страницы, новости, виды нанесения и документы. */
export function pageEntries(): Entry[] {
  const fixed: Entry[] = [
    { loc: "/", changefreq: "daily", priority: 1 },
    { loc: "/catalog", changefreq: "daily", priority: 0.9 },
    { loc: "/sale", changefreq: "weekly", priority: 0.8 },
    { loc: "/about", changefreq: "monthly", priority: 0.6 },
    { loc: "/delivery", changefreq: "monthly", priority: 0.6 },
    { loc: "/contact-us", changefreq: "monthly", priority: 0.6 },
    { loc: "/application-types", changefreq: "monthly", priority: 0.7 },
    { loc: "/news", changefreq: "weekly", priority: 0.6 },
    { loc: "/brief", changefreq: "yearly", priority: 0.4 },
    { loc: "/sitemap", changefreq: "weekly", priority: 0.3 },
    ...["/agreements", "/terms-of-use", "/personal-data-processing", "/printing-terms", "/claim-resolution-process"].map((loc) => ({ loc, changefreq: "yearly", priority: 0.2 })),
  ];
  return [
    ...fixed,
    ...Object.keys(COLLECTIONS).map((k) => ({ loc: `/catalog/${k}`, changefreq: "daily", priority: 0.7 })),
    ...applications.items.map((a) => ({ loc: a.href, changefreq: "monthly", priority: 0.6 })),
    ...(news as { slug: string; date?: string }[]).map((n) => ({ loc: `/news/${n.slug}`, lastmod: n.date, changefreq: "yearly", priority: 0.5 })),
  ];
}

export function categoryEntries(): Entry[] {
  return categoryPages().map((c) => ({ loc: c.href, changefreq: "daily", priority: c.level <= 2 ? 0.8 : 0.7 }));
}

/** Модели товаров (одна страница на модель — как карточка в каталоге). */
const modelsSql = `FROM (
  SELECT p.*, ROW_NUMBER() OVER (PARTITION BY COALESCE(p.color_group_id, p.id) ORDER BY (p.stock + p.remote > 0) DESC, p.rating DESC, p.id) rn
  FROM oc_products p WHERE p.deleted = 0 AND p.primary_cat IS NOT NULL
) x WHERE rn = 1`;

export async function productFiles(): Promise<number> {
  const [r] = await query<Row & { n: number }>(`SELECT COUNT(*) n ${modelsSql}`);
  return Math.max(1, Math.ceil(Number(r?.n ?? 0) / PRODUCTS_PER_FILE));
}

export async function productEntries(page: number): Promise<Entry[]> {
  const rows = await query<OcRow & { updated_at: Date | null; synced_at: Date | null }>(
    `SELECT id, supplier, slug, primary_cat, cover, updated_at, synced_at ${modelsSql} ORDER BY id LIMIT ? OFFSET ?`,
    [PRODUCTS_PER_FILE, page * PRODUCTS_PER_FILE],
  );
  return rows.map((r) => ({ loc: urlOf(r), lastmod: r.updated_at ?? r.synced_at, changefreq: "weekly", priority: 0.6, image: r.cover }));
}

/** Кэш готовых файлов на 6 часов: каталог меняется раз в сутки, а запрос по 30 тыс. моделей тяжёлый. */
const cache = new Map<string, { at: number; xml: Promise<string> }>();
export function cached(key: string, build: () => Promise<string>): Promise<string> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 6 * 3600_000) return hit.xml;
  const xml = build();
  cache.set(key, { at: Date.now(), xml });
  xml.catch(() => cache.delete(key));
  return xml;
}
