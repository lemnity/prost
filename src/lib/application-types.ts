import data from "@/content/application-types.json";
import { applications } from "@/content/home";
import { priceSections } from "@/lib/print-prices";

export type Block =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] };
export type Section = {
  tab: "description" | "prices" | "recommendations";
  heading: string;
  blocks: Block[];
};
export type ApplicationType = {
  slug: string;
  title: string;
  intro: string[];
  sections: Section[];
  images: { banner: string; gallery: string[] };
};

export const applicationTypes = data.items as ApplicationType[];
export const overview = data.overview as { title: string; sections: Section[] };

export function getApplicationType(slug: string): ApplicationType | undefined {
  const t = applicationTypes.find((a) => a.slug === slug);
  const prices = t && priceSections(slug);
  if (!t || !prices) return t;
  // Прайс из print-prices встаёт перед текстовыми разделами вкладки (например, «рассчитает менеджер»).
  const i = t.sections.findIndex((s) => s.tab === "prices");
  const sections = [...t.sections];
  sections.splice(i < 0 ? sections.findIndex((s) => s.tab === "recommendations") : i, 0, ...prices);
  return { ...t, sections };
}

/** Карточка из content/home: заголовок для списков, картинка товара, срок и тираж. */
export function getApplicationCard(slug: string) {
  return applications.items.find((a) => a.id === slug);
}

/** Группа нанесения в фильтре каталога (print=…), если для вида есть соответствие. */
const PRINT_GROUP: Record<string, string> = {
  "pad-press": "Тампопечать",
  "silk-press": "Шелкография",
  "laser-engraving": "Лазерная гравировка",
  "uv-press": "УФ-печать",
  embroidery: "Вышивка",
  "thermal-transfer": "Трансфер",
  "sublime-press": "Сублимация",
  "dome-stickers": "Наклейка",
  "uv-dtf": "УФ-печать",
  dtf: "Трансфер",
  "digital-press": "Цифровая печать",
};

export function catalogHrefFor(slug: string): string {
  const g = PRINT_GROUP[slug];
  return g ? `/catalog?print=${encodeURIComponent(g)}` : "/catalog";
}
