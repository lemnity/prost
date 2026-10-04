import type { CatalogNode } from "./types";

/** Содержимое мега-меню, отдаётся статическим /catalog-menu.json. */
export type MenuPotd = { title: string; image: string; url: string; priceFrom: number };
export type MenuData = {
  tree: CatalogNode[];
  /** Товар дня по id категории (карточка скрыта, если данных нет). */
  potd: Record<string, MenuPotd>;
};
