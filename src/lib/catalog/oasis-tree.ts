import snapshot from "@/data/oasis-tree.json";
import type { CatalogNode, Category } from "./types";

/**
 * Единое дерево каталога (основа — дерево Oasis), снимок в src/data/oasis-tree.json
 * (обновляется scripts/pull-catalog-tree.mjs). Адреса:
 *   «Продукция»: /catalog/<раздел>, /catalog/<раздел>/<подраздел>, 4-й уровень — ?c=<id>
 *   «Праздники» и «ВИП»: /catalog/prazdniki/<раздел>, /catalog/vip/<раздел>, 3-й уровень ВИП — ?c=<id>
 * Товар: <адрес раздела>/item-<слаг>-<id>.
 */
export type TreeCat = { id: number; parent: number | null; root: number | null; level: number; slug: string; name: string; count: number; image: string };

const ROOT = { products: 2891, holidays: 2269, vip: 1906 } as const;
const cats = (snapshot as { categories: TreeCat[] }).categories;
/** Версия снимка дерева — для сброса кэша меню в браузере. */
export const TREE_VERSION = String(Date.parse((snapshot as { generatedAt?: string }).generatedAt ?? "") || 0);
const byId = new Map(cats.map((c) => [c.id, c]));
const kids = new Map<number, TreeCat[]>();
for (const c of cats) if (c.parent) kids.set(c.parent, [...(kids.get(c.parent) ?? []), c]);

export const childrenOf = (id: number) => (kids.get(id) ?? []).filter((c) => c.count > 0);
export const getCat = (id: number) => byId.get(id);

/** Раздел-страница (у которого есть свой адрес), на который ведёт категория любого уровня. */
export function pageCat(id: number): TreeCat | undefined {
  let c = byId.get(id);
  while (c) {
    const maxLevel = c.root === ROOT.products ? 3 : 2;
    if (c.level <= maxLevel && c.level >= 1) return c;
    c = c.parent ? byId.get(c.parent) : undefined;
  }
  return undefined;
}

/** Адрес раздела (для 4-го уровня — подраздел с фильтром ?c=). */
export function catHref(id: number): string {
  const c = byId.get(id);
  if (!c) return "/catalog";
  if (c.level === 1) return c.id === ROOT.products ? "/catalog" : `/catalog/${c.slug}`;
  const page = pageCat(id)!;
  const parent = page.parent ? byId.get(page.parent) : undefined;
  let base: string;
  if (page.root === ROOT.products) base = page.level === 2 ? `/catalog/${page.slug}` : `/catalog/${parent?.slug}/${page.slug}`;
  else base = `/catalog/${byId.get(page.root!)?.slug}/${page.slug}`;
  return page.id === c.id ? base : `${base}?c=${c.id}`;
}

/** Хлебные крошки раздела (без «Главная» и «Каталог»). */
export function catTrail(id: number): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  for (let c = byId.get(id); c && !(c.level === 1 && c.id === ROOT.products); c = c.parent ? byId.get(c.parent) : undefined) {
    out.unshift({ label: c.name, href: catHref(c.id) });
  }
  return out;
}

/** Адрес товара по его основному разделу. Id Oasis может содержать «-» → кодируем как «x». */
export function productHref(primaryCat: number | null, slug: string, id: string): string {
  const page = primaryCat ? pageCat(primaryCat) : undefined;
  const base = page ? catHref(page.id).split("?")[0] : "/catalog/products";
  return `${base}/item-${slug}-${id.replace(/-/g, "x")}`;
}

/** Id товара из последнего сегмента адреса «item-<слаг>-<id>». */
export function idFromItem(segment: string): string | null {
  if (!segment.startsWith("item-")) return null;
  const tail = segment.slice(segment.lastIndexOf("-") + 1);
  // Oasis — цифры (дефис заменён на «x»), gifts.ru — «g» + цифры.
  if (/^g[0-9]+$/.test(tail)) return tail;
  return /^[0-9x]+$/.test(tail) ? tail.replace(/x/g, "-") : null;
}

/** Раздел по адресу: [top] или [top, sub]. */
export function resolveCat(top: string, sub?: string): TreeCat | undefined {
  const root = cats.find((c) => c.level === 1 && c.slug === top && c.id !== ROOT.products);
  const parent = root ?? childrenOf(ROOT.products).find((c) => c.slug === top);
  if (!parent) return undefined;
  if (!sub) return parent;
  return (kids.get(parent.id) ?? []).find((c) => c.slug === sub);
}

const holidays = byId.get(ROOT.holidays);
const vip = byId.get(ROOT.vip);

/** Верхние разделы: «Продукция» + «Праздники» и «ВИП», если в них есть товары. */
const tops = () => [...childrenOf(ROOT.products).filter((c) => c.count >= 5), ...[holidays, vip].filter((c): c is TreeCat => !!c && c.count > 0)];

/** Обложки крупных разделов — наши фото на белом фоне (фото товаров склада бывают на сером фоне и разного формата). */
const COVERS: Record<string, string> = {
  prazdniki: "/images/categories/prazdniki.webp",
  "podarochnie-nabori": "/images/categories/nabory.webp",
  "delovie-podarki": "/images/categories/nagrady.webp",
  "dlya-doma": "/images/categories/dom.webp",
  "dlya-otdiha": "/images/categories/otdyh.webp",
  zonti: "/images/categories/zonty.webp",
  "kuhnya-i-posuda": "/images/categories/posuda.webp",
  "lichnie-aksessuari": "/images/categories/promo.webp",
  "muzhskie-aksessuari": "/images/categories/elitnye.webp",
  tekstil: "/images/categories/odezhda.webp",
  "ofisnie-aksessuari": "/images/categories/ezhednevniki.webp",
  "pishuschie-instrumenti": "/images/categories/ruchki.webp",
  sumki: "/images/categories/sumki.webp",
  "tovari-dlya-detei": "/images/categories/detyam.webp",
  upakovka: "/images/categories/upakovka.webp",
  tehnologii: "/images/categories/elektronika.webp",
  selection: "/images/categories/korporativnye.webp",
};

/** Служебные разделы — в меню есть, на главной не показываем. */
const NOT_ON_HOME = new Set(["selection", "nastraivaemie-nabori", "kastomizaciya", "prazdniki"]); // «Праздники» — сезонная плитка

/** Верхнее меню каталога. */
export function topNodes(): CatalogNode[] {
  return tops().map((c) => ({
    id: c.slug,
    title: c.name,
    href: catHref(c.id),
    children: childrenOf(c.id).map((k) => ({ title: k.name, href: catHref(k.id) })),
  }));
}

/** Плитки разделов с обложкой и количеством. */
export function topCategories({ home = false } = {}): (Category & { count: number })[] {
  return tops()
    .filter((c) => !home || !NOT_ON_HOME.has(c.slug))
    .map((c) => ({ id: c.slug, title: c.name, href: catHref(c.id), image: COVERS[c.slug] ?? (c.image || childrenOf(c.id).find((k) => k.image)?.image || ""), count: c.count }));
}

/** Поиск раздела по названию (переадресация со старых адресов каталога). */
export function catByName(name: string): TreeCat | undefined {
  const n = name.trim().toLowerCase();
  return cats.find((c) => c.count > 0 && c.name.trim().toLowerCase() === n);
}

export { ROOT as TREE_ROOT };

/** Адреса всех непустых разделов (для карты сайта); подразделы третьего уровня с «?c=» не включаем. */
export function categoryPages(): { href: string; name: string; level: number }[] {
  const out: { href: string; name: string; level: number }[] = [];
  const walk = (id: number) => {
    for (const c of childrenOf(id)) {
      const href = catHref(c.id);
      if (!href.includes("?")) out.push({ href, name: c.name, level: c.level });
      walk(c.id);
    }
  };
  for (const t of tops()) {
    out.push({ href: catHref(t.id), name: t.name, level: t.level });
    walk(t.id);
  }
  return out;
}
