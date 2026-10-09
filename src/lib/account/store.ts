import type { CartItem } from "@/lib/cart/store";

/**
 * Личный кабинет: данные на сервере (/api/me, /api/auth/*), сессия — httpOnly cookie.
 * Здесь — клиентский снимок сессии для useSyncExternalStore и действия кабинета.
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
/** new — отправлена; work — в работе у менеджера; done — выполнена; cancelled — отменена. */
export type OrderStatus = "new" | "work" | "done" | "cancelled";

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
  return (status === "new" || status === "work") && now - Date.parse(o.date) < STALE_DAYS * 86_400_000;
}

export type Session = { profile: Profile; orders: readonly SavedOrder[]; createdAt: string; role: "user" | "admin"; emailVerified: boolean } | null;

type MePayload = { user: { profile: Profile; createdAt: string; role: "user" | "admin"; emailVerified: boolean } | null; orders?: SavedOrder[] };

let session: Session = null;
/** Ответ /api/me получен (до этого не показываем «войдите»). */
let loaded = false;
let loading: Promise<void> | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((cb) => cb());

function apply(p: MePayload) {
  session = p.user ? Object.freeze({ ...p.user, orders: p.orders ?? [] }) : null;
  loaded = true;
  emit();
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string; field?: string }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`, {
      credentials: "same-origin",
      ...init,
      headers: init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json", ...init.headers } : init.headers,
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string; field?: string };
    if (!res.ok) return { ok: false, status: res.status, error: data.error ?? "Ошибка сервера, попробуйте ещё раз", field: data.field };
    return { ok: true, data };
  } catch {
    return { ok: false, status: 0, error: "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз" };
  }
}

/** Перечитать сессию с сервера. */
export function refreshSession(): Promise<void> {
  loading = api<MePayload>("/api/me", { cache: "no-store" }).then((r) => {
    if (r.ok) apply(r.data);
    else if (!loaded) apply({ user: null });
    loading = null;
  });
  return loading;
}

function ensure() {
  if (!loaded && !loading && typeof window !== "undefined") void refreshSession();
}

function onFocus() {
  if (document.visibilityState === "visible") void refreshSession();
}

export function subscribeAccount(cb: () => void) {
  subs.add(cb);
  ensure();
  if (subs.size === 1) document.addEventListener("visibilitychange", onFocus);
  return () => {
    subs.delete(cb);
    if (subs.size === 0) document.removeEventListener("visibilitychange", onFocus);
  };
}

export function getSessionSnapshot(): Session {
  return session;
}
export const getSessionServerSnapshot = (): Session => null;
export const getLoadedSnapshot = () => loaded;
export const getLoadedServerSnapshot = () => false;

export type AuthResult = { ok: true } | { ok: false; field: string; error: string };

const result = (r: Awaited<ReturnType<typeof api<MePayload>>>, field = "password"): AuthResult => {
  if (r.ok) {
    apply(r.data);
    return { ok: true };
  }
  return { ok: false, field: r.field ?? field, error: r.error };
};

export async function signUp(profile: Omit<Profile, "email"> & { email: string }, password: string): Promise<AuthResult> {
  return result(await api<MePayload>("/api/auth/register", { method: "POST", body: JSON.stringify({ ...profile, password }) }), "email");
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  return result(await api<MePayload>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }));
}

export async function signInDemo(): Promise<AuthResult> {
  return result(await api<MePayload>("/api/auth/demo", { method: "POST" }));
}

export function signOut() {
  apply({ user: null });
  void api("/api/auth/logout", { method: "POST" });
}

export async function updateProfile(patch: Omit<Profile, "email" | "marketingAt">): Promise<AuthResult> {
  return result(await api<MePayload>("/api/me", { method: "PATCH", body: JSON.stringify({ profile: patch }) }), "name");
}

export async function updateDelivery(delivery: DeliveryPrefs): Promise<AuthResult> {
  if (session) {
    session = Object.freeze({ ...session, profile: { ...session.profile, delivery } });
    emit();
  }
  return result(await api<MePayload>("/api/me", { method: "PATCH", body: JSON.stringify({ delivery }) }), "address");
}

export async function changePassword(current: string, next: string): Promise<AuthResult> {
  const r = await api<{ ok: true }>("/api/me/password", { method: "POST", body: JSON.stringify({ current, next }) });
  return r.ok ? { ok: true } : { ok: false, field: r.field ?? "current", error: r.error };
}

export async function setOrderStatus(number: string, status: "done" | "cancelled") {
  if (session) {
    session = Object.freeze({ ...session, orders: session.orders.map((o) => (o.number === number ? { ...o, status } : o)) });
    emit();
  }
  await api(`/api/orders/${encodeURIComponent(number)}`, { method: "PATCH", body: JSON.stringify({ status }) });
  void refreshSession();
}

/** Отправить письмо подтверждения почты ещё раз. */
export async function resendVerification(): Promise<{ ok: boolean; error?: string }> {
  const r = await api<{ ok: true }>("/api/auth/verify", { method: "POST" });
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}
