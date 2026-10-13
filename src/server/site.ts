import { randomBytes } from "node:crypto";
import { exec, json, query, type Row } from "./db";
import { saveUploads } from "./chat";
import { banners as staticBanners, type Banner } from "@/content/home";
import { staticNews, toCard, topicsOf, TOPICS, type NewsCard, type NewsItem, type Topic } from "@/lib/news";
import { slugify } from "@/lib/translit";

/** Баннеры главной и новости: правятся в админке (раздел «Сайт»), читаются из базы с кэшем в памяти. */

/** Картинки баннеров и обложек — в общей таблице files с этой пометкой, отдаются публично по /media/<id>. */
export const SITE_FILES = "site";
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export type SiteNews = NewsItem & { topics: Topic[] };

const g = globalThis as unknown as { __psSiteSeeded?: Promise<void>; __psBanners?: Banner[]; __psNews?: SiteNews[] };

/**
 * Разовое наполнение из файлов репозитория. INSERT IGNORE по ключу: удалённые в админке
 * записи остаются удалёнными (deleted_at), новые статьи из репозитория добавляются.
 */
function seed(): Promise<void> {
  if (!g.__psSiteSeeded) {
    g.__psSiteSeeded = (async () => {
      for (const [i, b] of staticBanners.entries()) {
        await exec("INSERT IGNORE INTO site_banners (id, image, alt, href, sort) VALUES (?, ?, ?, ?, ?)", [b.id, b.image, b.alt, b.href ?? null, i]);
      }
      for (const n of staticNews) {
        await exec("INSERT IGNORE INTO site_news (slug, title, date, excerpt, cover, topics, blocks) VALUES (?, ?, ?, ?, ?, ?, ?)", [
          n.slug, n.title, n.date, n.excerpt, n.cover, JSON.stringify(topicsOf(n.slug)), JSON.stringify(n.blocks),
        ]);
      }
    })().catch((e) => {
      g.__psSiteSeeded = undefined;
      throw e;
    });
  }
  return g.__psSiteSeeded;
}

function resetCache() {
  g.__psBanners = undefined;
  g.__psNews = undefined;
}

// ── Чтение для сайта ──

type BannerRow = Row & { id: string; image: string; alt: string; href: string | null };

async function loadBanners(): Promise<Banner[]> {
  await seed();
  const rows = await query<BannerRow>("SELECT id, image, alt, href FROM site_banners WHERE deleted_at IS NULL ORDER BY sort, created_at");
  return rows.map((r) => ({ id: r.id, image: r.image, alt: r.alt, ...(r.href ? { href: r.href } : {}) }));
}

/** Баннеры главной; без базы (сборка, сбой) — из репозитория. */
export async function getBanners(): Promise<Banner[]> {
  if (g.__psBanners) return g.__psBanners;
  try {
    g.__psBanners = await loadBanners();
    return g.__psBanners;
  } catch {
    return staticBanners;
  }
}

type NewsRow = Row & { slug: string; title: string; d: string; excerpt: string; cover: string; topics: unknown; blocks: unknown };

async function loadNews(): Promise<SiteNews[]> {
  await seed();
  const rows = await query<NewsRow>(
    "SELECT slug, title, DATE_FORMAT(date, '%Y-%m-%d') d, excerpt, cover, topics, blocks FROM site_news WHERE deleted_at IS NULL ORDER BY date DESC, created_at DESC",
  );
  return rows.map((r) => ({
    slug: r.slug, title: r.title, date: r.d, excerpt: r.excerpt, cover: r.cover,
    topics: json<Topic[]>(r.topics) ?? [], blocks: json<NewsItem["blocks"]>(r.blocks) ?? [],
  }));
}

/** Все статьи, свежие сверху; без базы — из репозитория. */
export async function getAllNews(): Promise<SiteNews[]> {
  if (g.__psNews) return g.__psNews;
  try {
    g.__psNews = await loadNews();
    return g.__psNews;
  } catch {
    return staticNews.map((n) => ({ ...n, topics: topicsOf(n.slug) }));
  }
}

export async function getNewsCards(): Promise<NewsCard[]> {
  return (await getAllNews()).map((n) => toCard(n, n.topics));
}

export async function getNewsItem(slug: string): Promise<SiteNews | null> {
  return (await getAllNews()).find((n) => n.slug === slug) ?? null;
}

// ── Админка ──

/** Картинка из админки → адрес /media/<id>, либо текст ошибки. */
export async function saveSiteImage(file: File): Promise<{ url: string } | { error: string }> {
  if (!IMAGE_TYPES.includes(file.type)) return { error: "Нужна картинка: JPG, PNG, WebP, AVIF или GIF" };
  if (file.size > MAX_IMAGE_SIZE) return { error: "Картинка слишком большая (до 10 МБ)" };
  const [saved] = await saveUploads(SITE_FILES, [file]);
  if (!saved) return { error: "Не удалось сохранить картинку" };
  return { url: `/media/${saved.id}` };
}

/** Адрес картинки: только загруженная (/media/…) или из папки сайта (/images/…). */
const okImage = (s: string) => /^\/(media\/[a-f0-9]{24}|images\/[\w./-]+)$/.test(s);
/** Ссылка баннера: путь на сайте или https-адрес. */
const okHref = (s: string) => /^\/(?!\/)\S*$/.test(s) || /^https:\/\/\S+$/.test(s);

export async function adminBanners(): Promise<Banner[]> {
  return loadBanners();
}

export async function addBanner(b: { image: string; alt: string; href: string }): Promise<string | null> {
  if (!okImage(b.image)) return "Загрузите картинку баннера";
  if (!b.alt) return "Добавьте описание баннера: его читают поисковики и экранные дикторы";
  if (b.href && !okHref(b.href)) return "Ссылка должна начинаться с / или https://";
  await seed();
  const [max] = await query<Row & { m: number | null }>("SELECT MAX(sort) m FROM site_banners");
  await exec("INSERT INTO site_banners (id, image, alt, href, sort) VALUES (?, ?, ?, ?, ?)", [
    randomBytes(8).toString("hex"), b.image, b.alt, b.href || null, Number(max?.m ?? 0) + 1,
  ]);
  resetCache();
  return null;
}

export async function deleteBanner(id: string): Promise<void> {
  await exec("UPDATE site_banners SET deleted_at = UTC_TIMESTAMP() WHERE id = ? AND deleted_at IS NULL", [id]);
  resetCache();
}

export async function adminNews(): Promise<NewsCard[]> {
  return (await loadNews()).map((n) => toCard(n, n.topics));
}

export type NewsInput = { title: string; date: string; excerpt: string; cover: string; blocks: NewsItem["blocks"]; topics: string[] };

/** Новая статья → её адрес (slug) или текст ошибки. */
export async function addNews(n: NewsInput): Promise<{ slug: string } | { error: string }> {
  if (!n.title) return { error: "Укажите заголовок" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(n.date) || Number.isNaN(Date.parse(n.date))) return { error: "Укажите дату публикации" };
  if (!okImage(n.cover)) return { error: "Загрузите обложку" };
  if (!n.blocks.length) return { error: "Добавьте текст статьи" };
  const topics = n.topics.filter((t): t is Topic => t in TOPICS);
  const excerpt = n.excerpt || (n.blocks.find((b) => b.type === "p") as { text: string } | undefined)?.text.slice(0, 300) || "";
  await seed();
  // Адрес из заголовка; если такой уже есть (в том числе удалённый) — с числом в конце.
  const base = slugify(n.title, 120) || "news";
  const taken = new Set((await query<Row & { slug: string }>("SELECT slug FROM site_news WHERE slug LIKE ?", [`${base}%`])).map((r) => r.slug));
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  await exec("INSERT INTO site_news (slug, title, date, excerpt, cover, topics, blocks) VALUES (?, ?, ?, ?, ?, ?, ?)", [
    slug, n.title, n.date, excerpt, n.cover, JSON.stringify(topics), JSON.stringify(n.blocks),
  ]);
  resetCache();
  return { slug };
}

export async function deleteNews(slug: string): Promise<void> {
  await exec("UPDATE site_news SET deleted_at = UTC_TIMESTAMP() WHERE slug = ? AND deleted_at IS NULL", [slug]);
  resetCache();
}
