import type { CatalogNode } from "./types";

/** Содержимое мега-меню, отдаётся статическим /catalog-menu.json. */
export type MenuPotd = { title: string; image: string; url: string; priceFrom: number };
export type MenuData = {
  tree: CatalogNode[];
  /** Товар дня по id категории (только для категорий с коротким списком). */
  potd: Record<string, MenuPotd>;
};

/** Карточка «Товар дня» помещается рядом с не более чем 12 подкатегориями. */
export const POTD_MAX_CHILDREN = 12;
