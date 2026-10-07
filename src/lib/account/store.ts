import type { CartItem } from "@/lib/cart/store";

/**
 * Личный кабинет. Пока у сайта нет сервера, учётные записи живут в браузере
 * (как корзина и избранное); пароль хранится только как PBKDF2-хэш.
 * Когда появится API, заменить реализацию signIn/signUp/updateProfile/saveOrder —
 * интерфейс для компонентов останется прежним.
 */

export type Profile = {
  name: string;
  /** Фамилия и отчество — необязательные (в старых кабинетах полей может не быть). */
  lastName?: string;
  middleName?: string;
  email: string;
  phone: string;
  company: string;
  inn: string;
  city: string;
  address: string;
  /** Согласие на получение рекламных рассылок (необязательное). */
  marketing: boolean;
  /** Когда согласие дано (ISO) — нужно для подтверждения по 38-ФЗ «О рекламе». */
  marketingAt?: string;
  /** Настройки доставки (раздел «Доставка»). */
  delivery?: DeliveryPrefs;
};

export type DeliveryMethod = "pickup" | "courier" | "region";

export type Address = {
  id: string;
  /** Короткое имя: «Офис», «Склад». */
  label: string;
  city: string;
  address: string;
  recipient: string;
  phone: string;
  comment: string;
};

export type DeliveryPrefs = { method: DeliveryMethod; addresses: Address[]; defaultId: string | null };

/** Адрес по умолчанию (или первый сохранённый). */
export const defaultAddress = (p: Profile): Address | undefined =>
  p.delivery?.addresses.find((a) => a.id === p.delivery?.defaultId) ?? p.delivery?.addresses[0];

/** «Фамилия Имя Отчество» из заполненных частей. */
export const fullName = (p: Profile) => [p.lastName, p.name, p.middleName].filter(Boolean).join(" ");

/** Обращение: «Имя Отчество». */
export const greetName = (p: Profile) => [p.name, p.middleName].filter(Boolean).join(" ");

/** new — отправлена менеджеру; done — получена; cancelled — отменена. */
export type OrderStatus = "new" | "done" | "cancelled";

export type SavedOrder = {
  number: string;
  /** В старых заявках поля нет — считаем «new». */
  status?: OrderStatus;
  /** ISO-дата. */
  date: string;
  total: number;
  items: CartItem[];
  delivery: string;
  payment: string;
  /** Адрес доставки текстом (если не самовывоз). */
  address?: string;
};

/** Через сколько дней заявка без отметки уходит в историю. */
const STALE_DAYS = 60;

/** Текущая ли заявка (не закрыта и не старше STALE_DAYS). */
export function isCurrentOrder(o: SavedOrder, now: number): boolean {
  const status = o.status ?? "new";
  return status === "new" && now - Date.parse(o.date) < STALE_DAYS * 86_400_000;
}

type Account = { profile: Profile; salt: string; hash: string; orders: SavedOrder[]; createdAt: string };
type Db = { accounts: Record<string, Account>; session: string | null };

export type Session = { profile: Profile; orders: readonly SavedOrder[]; createdAt: string } | null;

export const ACCOUNT_KEY = "prostyle-account-v1";
const MAX_ORDERS = 50;

let db: Db = { accounts: {}, session: null };
let session: Session = null;
let loaded = false;
const subs = new Set<() => void>();

const normEmail = (e: string) => e.trim().toLowerCase();

function isDb(x: unknown): x is Db {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return typeof o.accounts === "object" && o.accounts !== null && (o.session === null || typeof o.session === "string");
}

function derive() {
  const acc = db.session ? db.accounts[db.session] : undefined;
  session = acc ? Object.freeze({ profile: acc.profile, orders: acc.orders, createdAt: acc.createdAt }) : null;
}

function read() {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    const data: unknown = raw ? JSON.parse(raw) : null;
    db = isDb(data) ? data : { accounts: {}, session: null };
  } catch {
    db = { accounts: {}, session: null };
  }
  derive();
}

function commit() {
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(db));
  } catch {}
  derive();
  subs.forEach((cb) => cb());
}

function ensure() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    read();
  }
}

function onStorage(e: StorageEvent) {
  if (e.key === ACCOUNT_KEY || e.key === null) {
    read();
    subs.forEach((cb) => cb());
  }
}

export function subscribeAccount(cb: () => void) {
  subs.add(cb);
  if (subs.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    subs.delete(cb);
    if (subs.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getSessionSnapshot(): Session {
  ensure();
  return session;
}
export const getSessionServerSnapshot = (): Session => null;

const hex = (b: ArrayBuffer | Uint8Array) =>
  Array.from(b instanceof Uint8Array ? b : new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");

async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 120_000 },
    key,
    256,
  );
  return hex(bits);
}

export type AuthResult = { ok: true } | { ok: false; field: "email" | "password"; error: string };

export async function signUp(profile: Profile, password: string): Promise<AuthResult> {
  ensure();
  const email = normEmail(profile.email);
  if (db.accounts[email]) {
    return { ok: false, field: "email", error: "Кабинет с таким email уже есть — войдите" };
  }
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await hashPassword(password, salt);
  db = {
    accounts: { ...db.accounts, [email]: { profile: { ...profile, email, ...(profile.marketing ? { marketingAt: new Date().toISOString() } : {}) }, salt, hash, orders: [], createdAt: new Date().toISOString() } },
    session: email,
  };
  commit();
  return { ok: true };
}

export async function signIn(emailRaw: string, password: string): Promise<AuthResult> {
  ensure();
  const email = normEmail(emailRaw);
  const acc = db.accounts[email];
  if (!acc) return { ok: false, field: "email", error: "Кабинет с таким email не найден" };
  if ((await hashPassword(password, acc.salt)) !== acc.hash) {
    return { ok: false, field: "password", error: "Неверный пароль" };
  }
  db = { ...db, session: email };
  commit();
  return { ok: true };
}

export function signOut() {
  ensure();
  db = { ...db, session: null };
  commit();
}

export function updateProfile(patch: Omit<Profile, "email" | "marketingAt">) {
  ensure();
  const email = db.session;
  const acc = email ? db.accounts[email] : undefined;
  if (!email || !acc) return;
  const marketingAt = patch.marketing
    ? acc.profile.marketing ? acc.profile.marketingAt : new Date().toISOString()
    : undefined;
  const profile = { ...acc.profile, ...patch, email, marketingAt };
  db = { ...db, accounts: { ...db.accounts, [email]: { ...acc, profile } } };
  commit();
}

/** Сохраняет отправленный заказ в историю текущего кабинета (если пользователь вошёл). */
export function saveOrder(order: SavedOrder) {
  ensure();
  const email = db.session;
  const acc = email ? db.accounts[email] : undefined;
  if (!email || !acc) return;
  const orders = [order, ...acc.orders.filter((o) => o.number !== order.number)].slice(0, MAX_ORDERS);
  db = { ...db, accounts: { ...db.accounts, [email]: { ...acc, orders } } };
  commit();
}

function patchAccount(fn: (acc: Account) => Account) {
  ensure();
  const email = db.session;
  const acc = email ? db.accounts[email] : undefined;
  if (!email || !acc) return;
  db = { ...db, accounts: { ...db.accounts, [email]: fn(acc) } };
  commit();
}

export function setOrderStatus(number: string, status: OrderStatus) {
  patchAccount((acc) => ({ ...acc, orders: acc.orders.map((o) => (o.number === number ? { ...o, status } : o)) }));
}

export function updateDelivery(delivery: DeliveryPrefs) {
  patchAccount((acc) => ({ ...acc, profile: { ...acc.profile, delivery } }));
}

export async function changePassword(current: string, next: string): Promise<AuthResult> {
  ensure();
  const email = db.session;
  const acc = email ? db.accounts[email] : undefined;
  if (!email || !acc) return { ok: false, field: "password", error: "Войдите в кабинет" };
  if ((await hashPassword(current, acc.salt)) !== acc.hash) {
    return { ok: false, field: "password", error: "Текущий пароль указан неверно" };
  }
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await hashPassword(next, salt);
  patchAccount((a) => ({ ...a, salt, hash }));
  return { ok: true };
}
