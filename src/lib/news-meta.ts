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
