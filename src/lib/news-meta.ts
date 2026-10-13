// Лёгкие типы и справочники новостей — без текстов статей (можно импортировать на клиенте).

export type NewsBlock =
  | { type: "h2" | "h3" | "p"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "img"; src: string; w: number; h: number };

export type NewsItem = {
  slug: string;
  title: string;
  /** ISO-дата публикации. */
  date: string;
  excerpt: string;
  cover: string;
  blocks: NewsBlock[];
};

export const formatNewsDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

export const TOPICS = {
  gifts: "Корпоративные подарки",
  ideas: "Идеи подарков",
  branding: "Нанесение и упаковка",
  eco: "Эко-подарки",
} as const;
export type Topic = keyof typeof TOPICS;

/** Карточка для списка — без текста статьи (меньше данных на клиенте). */
export type NewsCard = Omit<NewsItem, "blocks"> & { minutes: number; topics: Topic[] };

/**
 * Текст статьи из админки → блоки. Абзацы разделяются пустой строкой;
 * «## » — заголовок, «### » — подзаголовок, строки с «- » — список, с «1. » — нумерованный список.
 */
export function textToBlocks(text: string): NewsBlock[] {
  const out: NewsBlock[] = [];
  for (const chunk of text.replace(/\r/g, "").split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const h = /^(#{2,3})\s+(.+)$/.exec(lines[0]);
    if (h && lines.length === 1) {
      out.push({ type: h[1].length === 2 ? "h2" : "h3", text: h[2] });
    } else if (lines.every((l) => /^[-•*]\s+/.test(l))) {
      out.push({ type: "ul", items: lines.map((l) => l.replace(/^[-•*]\s+/, "")) });
    } else if (lines.every((l) => /^\d+[.)]\s+/.test(l))) {
      out.push({ type: "ol", items: lines.map((l) => l.replace(/^\d+[.)]\s+/, "")) });
    } else {
      out.push({ type: "p", text: lines.join(" ") });
    }
  }
  return out;
}
