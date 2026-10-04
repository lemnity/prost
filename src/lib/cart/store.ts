export type CartItem = {
  id: string;
  sku: string;
  title: string;
  image: string;
  url: string;
  price: number;
  qty: number;
};

export const CART_KEY = "prostyle-cart-v1";
export const MIN_ORDER = 10000;
const MAX_QTY = 99999;

const EMPTY: readonly CartItem[] = Object.freeze([]);
let items: readonly CartItem[] = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

function isItem(x: unknown): x is CartItem {
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
    typeof o.qty === "number" &&
    Number.isInteger(o.qty) &&
    o.qty >= 1
  );
}

function read(): readonly CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return EMPTY;
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || !data.every(isItem)) throw new Error("bad");
    return data.length ? Object.freeze(data.map((i) => ({ ...i, qty: Math.min(i.qty, MAX_QTY) }))) : EMPTY;
  } catch {
    try {
      localStorage.removeItem(CART_KEY);
    } catch {}
    return EMPTY;
  }
}

function persist() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {}
}

function emit() {
  subs.forEach((cb) => cb());
}

function commit(next: readonly CartItem[]) {
  items = next.length ? Object.freeze(next) : EMPTY;
  persist();
  emit();
}

function ensure() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    items = read();
  }
}

function onStorage(e: StorageEvent) {
  if (e.key === CART_KEY || e.key === null) {
    items = read();
    emit();
  }
}

export function subscribeCart(cb: () => void) {
  subs.add(cb);
  if (subs.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    subs.delete(cb);
    if (subs.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getCartSnapshot(): readonly CartItem[] {
  ensure();
  return items;
}
export const getCartServerSnapshot = (): readonly CartItem[] => EMPTY;

const clamp = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.floor(n) || 1));

export function addToCart(item: Omit<CartItem, "qty">) {
  ensure();
  const found = items.find((i) => i.id === item.id);
  commit(
    found
      ? items.map((i) => (i.id === item.id ? { ...i, qty: clamp(i.qty + 1) } : i))
      : [...items, { ...item, qty: 1 }],
  );
}

export function setQty(id: string, qty: number) {
  ensure();
  commit(items.map((i) => (i.id === id ? { ...i, qty: clamp(qty) } : i)));
}

export function removeFromCart(id: string) {
  ensure();
  commit(items.filter((i) => i.id !== id));
}

export function clearCart() {
  ensure();
  commit([]);
}

export const cartCount = (list: readonly CartItem[]) => list.reduce((s, i) => s + i.qty, 0);
export const cartTotal = (list: readonly CartItem[]) => list.reduce((s, i) => s + i.qty * i.price, 0);
