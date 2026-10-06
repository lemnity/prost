import data from "@/content/application-types.json";
import { applications } from "@/content/home";

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
  return applicationTypes.find((a) => a.slug === slug);
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
  "digital-press": "Цифровая печать",
};

export function catalogHrefFor(slug: string): string {
  const g = PRINT_GROUP[slug];
  return g ? `/catalog?print=${encodeURIComponent(g)}` : "/catalog";
}
