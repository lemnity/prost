/** Снимок товара в избранном: хватает для карточки без обращения к каталогу. */
export type FavoriteItem = {
  id: string;
  sku: string;
  title: string;
  image: string;
  url: string;
  price: number;
  /** Цена до скидки (распродажа). */
  oldPrice?: number;
  stock: number;
  preorder?: boolean;
  isNew?: boolean;
  /** Когда добавлен (ms) — для сортировки «сначала новые». */
  addedAt: number;
};

export const FAVORITES_HREF = "/account/favorites";
export const FAVORITES_KEY = "prostyle-favorites-v1";
const MAX_ITEMS = 500;

const EMPTY: readonly FavoriteItem[] = Object.freeze([]);
let items: readonly FavoriteItem[] = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

function isItem(x: unknown): x is FavoriteItem {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.sku === "string" &&
    typeof o.title === "string" &&
    typeof o.image === "string" &&
    typeof o.url === "string" &&
    typeof o.price === "number" &&
    Number.isFinite(o.price) &&
    o.price >= 0 &&
    typeof o.stock === "number" &&
    Number.isFinite(o.stock) &&
    typeof o.addedAt === "number"
  );
}

function read(): readonly FavoriteItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return EMPTY;
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error("bad");
    const seen = new Set<string>();
    const list = data.filter(isItem).filter((i) => !seen.has(i.id) && !!seen.add(i.id));
    return list.length ? Object.freeze(list.slice(0, MAX_ITEMS)) : EMPTY;
  } catch {
    try {
      localStorage.removeItem(FAVORITES_KEY);
    } catch {}
    return EMPTY;
  }
}

function commit(next: readonly FavoriteItem[]) {
  items = next.length ? Object.freeze(next.slice(0, MAX_ITEMS)) : EMPTY;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  } catch {}
  subs.forEach((cb) => cb());
}

function ensure() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    items = read();
  }
}

function onStorage(e: StorageEvent) {
  if (e.key === FAVORITES_KEY || e.key === null) {
    items = read();
    subs.forEach((cb) => cb());
  }
}

export function subscribeFavorites(cb: () => void) {
  subs.add(cb);
  if (subs.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    subs.delete(cb);
    if (subs.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getFavoritesSnapshot(): readonly FavoriteItem[] {
  ensure();
  return items;
}
export const getFavoritesServerSnapshot = (): readonly FavoriteItem[] => EMPTY;

/** Добавляет или убирает товар; возвращает true, если товар теперь в избранном. */
export function toggleFavorite(item: Omit<FavoriteItem, "addedAt">): boolean {
  ensure();
  if (items.some((i) => i.id === item.id)) {
    commit(items.filter((i) => i.id !== item.id));
    return false;
  }
  commit([{ ...item, addedAt: Date.now() }, ...items]);
  return true;
}

export function removeFavorite(id: string) {
  ensure();
  commit(items.filter((i) => i.id !== id));
}

export function clearFavorites() {
  ensure();
  commit([]);
}
