import { site } from "@/content/site";
import { formatPriceValue, formatQty } from "@/lib/format";
import { plural } from "@/lib/plural";
import { cartCount, cartDiscount, MIN_ORDER } from "@/lib/cart/store";
import type { CartItem } from "@/lib/cart/store";
import type { ChatFileMeta } from "./types";

export const AGENT = { name: "Виктория Широкова", firstName: "Виктория", role: "Персональный менеджер", photo: "/images/manager/viktoriya.webp" };

/** Пауза «прочитать сообщение» и скорость набора — чтобы ответы приходили как у живого менеджера. */
export const READ_MS = 2200;
export const typingMs = (text: string) => Math.min(14_000, 2500 + text.length * 30);

/** Первые сообщения после оформления заявки: приветствие и разбор корзины. */
export type AgentDraft = { text: string; typeAt: number; at: number };
type OrderInfo = { name: string; number: string; items: CartItem[]; total: number };

export function openingMessages(chat: OrderInfo, now = Date.now()): AgentDraft[] {
  const hello = chat.name ? `Здравствуйте, ${chat.name}!` : "Здравствуйте!";
  const greetAt = now + 1500;
  return [
    {
      typeAt: now + 300,
      at: greetAt,
      text: `${hello} Меня зовут ${AGENT.firstName}, я ваш персональный менеджер. Спасибо за ваше оформление, сейчас изучаю вашу корзину.`,
    },
    // Разбор корзины — через 25 секунд: менеджер «изучает» заказ, потом пишет длинное сообщение.
    { typeAt: greetAt + 9000, at: greetAt + 25_000, text: cartReview(chat) },
  ];
}


function cartReview({ number, items, total }: OrderInfo): string {
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
  notes.push("Цены в корзине указаны без нанесения. Пришлите логотип прямо в этот чат — лучше в векторе (AI, EPS, PDF или CDR) — и я рассчитаю нанесение и подготовлю макет.");
  lines.push(notes.join("\n\n"));
  lines.push("Подскажите, к какой дате нужен заказ и какое нанесение планируете?");
  return lines.join("\n\n");
}

const RULES: [RegExp, () => string][] = [
  [/логотип|нанес|печат|гравир|макет|вышив|тиснен/, () =>
    `Пришлите логотип прямо сюда в чат (скрепка слева от поля ввода) — лучше в векторе: AI, EPS, PDF или CDR. Подберу способ нанесения под материал товара и тираж и пришлю расчёт с макетом.`],
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

export function ruleReply(text: string): string {
  const t = text.toLowerCase().trim();
  const hit = RULES.find(([re]) => re.test(t));
  return hit
    ? hit[1]()
    : `Записала ваш вопрос и передала в работу — подробно отвечу в рабочее время (${site.hours.toLowerCase()}). Если срочно, звоните ${site.phone.label}.`;
}

/** Ответ на вложения, пока нет сервера: файлы остаются в браузере клиента. */
export function filesReply(files: Pick<ChatFileMeta, "name">[]): string {
  const names = files.map((f) => f.name).join(", ");
  return `Спасибо, ${files.length === 1 ? "файл получила" : "файлы получила"}: ${names}. Передам дизайнеру — подготовлю расчёт нанесения и макет и вернусь с ответом в этот чат.`;
}
