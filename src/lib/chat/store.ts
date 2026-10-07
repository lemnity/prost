import type { CartItem } from "@/lib/cart/store";
import type { ChatFile } from "./files";

/** Сообщение чата. at — момент, с которого сообщение видно (для «печатает…» у ответов). */
export type ChatMessage = { id: string; role: "agent" | "user"; text: string; at: number; files?: ChatFile[] };

export type Chat = {
  /** Номер заявки — он же ключ чата. */
  number: string;
  /** Как обращаться к клиенту. */
  name: string;
  createdAt: number;
  total: number;
  items: CartItem[];
  /** Текст заявки (для копирования, если письмо не ушло). */
  orderText: string;
  /** Открылся ли почтовый клиент с заявкой. */
  mailOpened: boolean;
  /** Email кабинета, если клиент вошёл. */
  owner: string | null;
  messages: ChatMessage[];
};

export const CHATS_KEY = "prostyle-chats-v1";
const MAX_CHATS = 30;

type Db = Record<string, Chat>;
const EMPTY: Db = Object.freeze({}) as Db;
let db: Db = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

/** Старые приветствия (до переименования менеджера) приводим к актуальному имени. */
const OLD_NAME = /Меня зовут (Анжела|Виктория Широкова),/;

function migrate(data: Db): Db {
  return Object.fromEntries(
    Object.entries(data).map(([k, c]) => [
      k,
      { ...c, messages: (c.messages ?? []).map((m) => (m.role === "agent" && OLD_NAME.test(m.text) ? { ...m, text: m.text.replace(OLD_NAME, "Меня зовут Виктория,") } : m)) },
    ]),
  );
}

function read(): Db {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    const data: unknown = raw ? JSON.parse(raw) : null;
    return data && typeof data === "object" && !Array.isArray(data) ? Object.freeze(migrate(data as Db)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function commit(next: Db) {
  const list = Object.values(next).sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_CHATS);
  db = Object.freeze(Object.fromEntries(list.map((c) => [c.number, c])));
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(db));
  } catch {}
  subs.forEach((cb) => cb());
}

function ensure() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    db = read();
  }
}

function onStorage(e: StorageEvent) {
  if (e.key === CHATS_KEY || e.key === null) {
    db = read();
    subs.forEach((cb) => cb());
  }
}

export function subscribeChats(cb: () => void) {
  subs.add(cb);
  if (subs.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    subs.delete(cb);
    if (subs.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getChatsSnapshot(): Db {
  ensure();
  return db;
}
export const getChatsServerSnapshot = (): Db => EMPTY;

let seq = 0;
export const messageId = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

export function createChat(chat: Chat) {
  ensure();
  commit({ ...db, [chat.number]: chat });
}

export function appendMessages(number: string, messages: ChatMessage[]) {
  ensure();
  const chat = db[number];
  if (!chat) return;
  commit({ ...db, [number]: { ...chat, messages: [...chat.messages, ...messages] } });
}
