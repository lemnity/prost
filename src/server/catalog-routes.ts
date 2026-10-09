import { permanentRedirect } from "next/navigation";
import { catByName, catHref, childrenOf, idFromItem, resolveCat, topNodes, type TreeCat } from "@/lib/catalog/oasis-tree";
import { getCategoryNode, getProductByUrl, getSubcategories } from "@/lib/catalog/products";
import type { SectionLink } from "@/components/catalog/section-select";
import { getProductRow, rowByArticle, urlOf, type OcRow } from "./catalog";

type Collection = { title: string; sort: "new" | "popular"; sale: boolean; inStock: boolean; theme?: { words: string[]; cats: number[] } };

/** Подборки: /catalog/new, /catalog/hits, /catalog/sale, /catalog/novyy-god. */
export const COLLECTIONS: Record<string, Collection> = {
  new: { title: "Новинки", sort: "new", sale: false, inStock: true },
  hits: { title: "Хиты", sort: "popular", sale: false, inStock: true },
  sale: { title: "Распродажа", sort: "popular", sale: true, inStock: false },
  // Новогодние товары: раздел «Праздники / Новый год» (gifts.ru), «Новогодние наборы» (Oasis) и по названию.
  "novyy-god": { title: "Новогодние подарки", sort: "popular", sale: false, inStock: false, theme: { words: ["новогод", "ёлоч", "елоч", "рождеств", "дед мороз", "снегов"], cats: [5286, 2289] } },
};
export const isCollection = (s: string): s is keyof typeof COLLECTIONS => Object.hasOwn(COLLECTIONS, s);

/** Товар по сегменту «item-…» или null. */
export async function productFromItem(item: string): Promise<OcRow | null> {
  const id = idFromItem(item);
  return id ? getProductRow(id) : null;
}

/** Канонический адрес товара: если раздел сменился — постоянная переадресация. */
export function ensureCanonical(row: OcRow, path: string) {
  const want = urlOf(row);
  if (want !== path) permanentRedirect(want);
}

/** Старые разделы верхнего уровня → разделы единого дерева. */
const LEGACY_TOPS: Record<string, string> = {
  "promo-odezhda": "/catalog/tekstil",
  "podarochnye-nabory": "/catalog/podarochnie-nabori",
  ejednevniki: "/catalog/ofisnie-aksessuari",
  posuda: "/catalog/kuhnya-i-posuda",
  elektronika: "/catalog/tehnologii",
  sumki: "/catalog/sumki",
  upakovka: "/catalog/upakovka",
  dom: "/catalog/dlya-doma",
  ruchki: "/catalog/pishuschie-instrumenti",
  zonty: "/catalog/zonti",
  personalnye: "/catalog/lichnie-aksessuari",
  nagrady: "/catalog/delovie-podarki",
  "puteshestvie-i-otdy-x": "/catalog/dlya-puteshestvii",
  promo: "/catalog/lichnie-aksessuari",
  vip: "/catalog/delovie-podarki",
  "suveniry-k-prazdnikam": "/catalog/prazdniki",
  chasy: "/catalog/ofisnie-aksessuari",
  "uhod-i-zdorovie": "/catalog/lichnie-aksessuari",
  detyam: "/catalog/tovari-dlya-detei",
};

/** Старые адреса (каталог до подключения склада): товар по артикулу, раздел по названию. */
export async function legacyRedirect(path: string): Promise<never | void> {
  const parts = path.split("/").filter(Boolean); // catalog, top, [sub], [item]
  const old = getProductByUrl(path);
  if (old) {
    const row = await rowByArticle(old.sku);
    permanentRedirect(row ? urlOf(row) : old.subcategory ? `/catalog/${old.category}/${old.subcategory}` : `/catalog/${old.category}`);
  }
  const top = parts[1];
  const node = top ? getCategoryNode(top) : null;
  if (!node) return;
  const sub = parts[2] && !parts[2].startsWith("item-") ? getSubcategories(top).find((s) => s.slug === parts[2]) : undefined;
  const target = (sub && catByName(sub.title)) || catByName(node.title);
  permanentRedirect(target ? catHref(target.id) : LEGACY_TOPS[top] ?? "/catalog");
}

/** Боковое меню: верхние разделы каталога (активный — текущий). */
export function topSections(activeSlug?: string): SectionLink[] {
  return topNodes().map((n) => ({ title: n.title, href: n.href, active: n.id === activeSlug }));
}

export function subSections(parent: TreeCat, activeId?: number): SectionLink[] {
  return [
    { title: "Все товары", href: catHref(parent.id), active: !activeId, count: parent.count },
    ...childrenOf(parent.id).map((c) => ({ title: c.name, href: catHref(c.id), active: c.id === activeId, count: c.count })),
  ];
}

export { resolveCat };
