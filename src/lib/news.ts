import raw from "@/content/news.json";
import type { NewsCard, NewsItem, Topic } from "./news-meta";

export * from "./news-meta";

/** Новости — свежие сверху. */
export const news: NewsItem[] = (raw as NewsItem[]).slice().sort((a, b) => b.date.localeCompare(a.date));

export const getNews = (slug: string) => news.find((n) => n.slug === slug) ?? null;

/** Примерное время чтения в минутах (≈180 слов/мин). */
export function readingMinutes(n: NewsItem): number {
  const words = n.blocks.reduce((s, b) => s + ("text" in b ? b.text : "items" in b ? b.items.join(" ") : "").split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / 180));
}

const TOPICS_BY_SLUG: Record<string, Topic[]> = {
  "vse-o-pechati-na-paketakh-vidy-razmery-materialy": ["branding"],
  "pravilnye-korporativnye-podarki-i-ehffektivnyj-marketing": ["gifts"],
  "what-to-give-in-winter": ["ideas"],
  "take-care-of-nature-with-us": ["eco", "ideas"],
  "so-this-is-a-gift": ["ideas", "gifts"],
};

export const topicsOf = (slug: string): Topic[] => TOPICS_BY_SLUG[slug] ?? [];

export const newsCards: NewsCard[] = news.map(({ blocks: _blocks, ...n }) => ({
  ...n,
  minutes: readingMinutes({ ...n, blocks: _blocks }),
  topics: topicsOf(n.slug),
}));
