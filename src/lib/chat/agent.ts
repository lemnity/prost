import { site } from "@/content/site";
import { formatPriceValue, formatQty } from "@/lib/format";
import { plural } from "@/lib/plural";
import { cartCount, cartDiscount, MIN_ORDER } from "@/lib/cart/store";
import { createChat, messageId, type Chat, type ChatMessage } from "./store";

export const AGENT = { name: "Анжела", role: "Персональный менеджер" };

/**
 * Адрес сервера с ИИ-моделью (POST { order, messages } → { reply }).
 * Ключ модели хранится только на этом сервере, не в браузере.
 * Пока адреса нет, Анжела отвечает по встроенным правилам ниже.
 */
const CHAT_API = process.env.NEXT_PUBLIC_CHAT_API ?? "";

const TYPING_MS = 1600;

/** Первые сообщения после оформления заявки: приветствие и разбор корзины. */
export function openingMessages(chat: Pick<Chat, "name" | "number" | "items" | "total">, now = Date.now()): ChatMessage[] {
  const hello = chat.name ? `Здравствуйте, ${chat.name}!` : "Здравствуйте!";
  return [
    {
      id: messageId(),
      role: "agent",
      at: now + 700,
      text: `${hello} Меня зовут ${AGENT.name}, я ваш персональный менеджер. Спасибо за ваше оформление, сейчас изучаю вашу корзину.`,
    },
    { id: messageId(), role: "agent", at: now + 700 + 4200, text: cartReview(chat) },
  ];
}

function cartReview({ number, items, total }: Pick<Chat, "number" | "items" | "total">): string {
  const qty = cartCount(items);
  const lines = [
    `Я изучила вашу корзину по заявке № ${number}: ${items.length} ${plural("item", items.length)}, ${formatQty(qty)} шт. на сумму от ${formatPriceValue(total)}.`,
  ];
  const shown = items.slice(0, 4).map((i) => `• ${i.title} — ${formatQty(i.qty)} шт.`);
  if (items.length > 4) shown.push(`• и ещё ${items.length - 4} ${plural("item", items.length - 4)}`);
  lines.push(shown.join("\n"));

  const notes: string[] = [];
  const discount = cartDiscount(items);
  if (discount > 0) {
    notes.push(`В заказе есть товары распродажи недели — экономия ${formatPriceValue(discount)}. Цены со скидкой действуют до воскресенья 23:59, поэтому лучше подтвердить заказ до конца недели.`);
  }
  const preorder = items.filter((i) => i.preorder);
  if (preorder.length) {
    notes.push(`${preorder.length === 1 ? "Позиция" : "Позиции"} под заказ: ${preorder.map((i) => i.title).join(", ")}. Уточню сроки поставки и вернусь с ответом.`);
  }
  if (total < MIN_ORDER) {
    notes.push(`Сумма пока меньше минимального заказа ${formatPriceValue(MIN_ORDER)} — подскажу, чем дополнить заказ.`);
  }
  notes.push("Цены в корзине указаны без нанесения. Пришлите логотип — лучше в векторе (AI, EPS, PDF или CDR) — и я рассчитаю нанесение и подготовлю макет.");
  lines.push(notes.join("\n\n"));
  lines.push("Подскажите, к какой дате нужен заказ и какое нанесение планируете?");
  return lines.join("\n\n");
}

const RULES: [RegExp, () => string][] = [
  [/логотип|нанес|печат|гравир|макет|вышив|тиснен/, () =>
    `Пришлите логотип на ${site.email} с номером заявки в теме письма — лучше в векторе (AI, EPS, PDF или CDR). Подберу способ нанесения под материал товара и тираж и пришлю расчёт с макетом.`],
  [/срок|когда|дат|успе|быстр|срочн/, () =>
    "Сроки рассчитаю после подтверждения наличия и способа нанесения. Напишите желаемую дату получения — постараюсь уложиться и сразу скажу, если нужно что-то заменить."],
  [/достав|самовывоз|привез|курьер|отправ/, () =>
    `Можно забрать заказ самовывозом: ${site.address}, ${site.hours.toLowerCase()}. Также доставляем курьером по Тюмени и в регионы России — стоимость доставки посчитаю после подтверждения заказа.`],
  [/оплат|сч[её]т|безнал|карт|налич|ндс/, () =>
    "Работаем с организациями и ИП: выставим счёт на компанию. Также можно оплатить банковской картой или наличными. Счёт пришлю после согласования состава и нанесения."],
  [/скидк|дешевл|цен|акци|распрод/, () =>
    "Актуальные скидки собраны на странице «Распродажа недели». По вашему заказу проверю, можно ли предложить более выгодные аналоги."],
  [/позвон|звон|телефон|связ|перезвон/, () =>
    `Конечно! Наш телефон ${site.phone.label}, ${site.hours.toLowerCase()}. Можете оставить удобное время звонка здесь — передам коллегам.`],
  [/спасибо|благодар/, () => "Пожалуйста! Если появятся вопросы по заказу — пишите, я на связи."],
  [/^(привет|здравств|добр)/, () => "Здравствуйте! Чем могу помочь по вашему заказу?"],
];

function ruleReply(text: string): string {
  const t = text.toLowerCase().trim();
  const hit = RULES.find(([re]) => re.test(t));
  return hit
    ? hit[1]()
    : `Записала ваш вопрос и передала в работу — подробно отвечу в рабочее время (${site.hours.toLowerCase()}). Если срочно, звоните ${site.phone.label}.`;
}

/** Ответ Анжелы на сообщение клиента: через ИИ-сервер, если он подключён, иначе по правилам. */
export async function agentReply(chat: Chat, text: string): Promise<ChatMessage> {
  const started = Date.now();
  let reply = "";
  if (CHAT_API) {
    try {
      const res = await fetch(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: { number: chat.number, total: chat.total, items: chat.items.map(({ title, sku, qty, price }) => ({ title, sku, qty, price })) },
          messages: [...chat.messages, { role: "user", text }].map(({ role, text: t }) => ({ role, text: t })),
        }),
      });
      if (res.ok) reply = String(((await res.json()) as { reply?: unknown }).reply ?? "").trim();
    } catch {}
  }
  if (!reply) reply = ruleReply(text);
  return { id: messageId(), role: "agent", text: reply, at: Math.max(Date.now(), started + TYPING_MS) };
}

/** Открывает чат по только что оформленной заявке с приветствием и разбором корзины. */
export function startChat(chat: Omit<Chat, "createdAt" | "messages">) {
  const now = Date.now();
  createChat({ ...chat, createdAt: now, messages: openingMessages(chat, now) });
}
