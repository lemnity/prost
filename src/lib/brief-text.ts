import { site } from "@/content/site";
import { MAILTO_LIMIT } from "@/lib/cart/order-text";

export type BriefData = {
  company: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  kinds: string[];
  qty: string;
  budget: string;
  deadline: string;
  occasion: string;
  idea: string;
  prints: string[];
  brandbook: string;
};

export const KINDS = ["Мерч/одежда", "Подарочные наборы", "Упаковка", "Полиграфия", "Сувениры", "Другое"];
export const CITIES = ["Тюмень", "Москва", "Другой"];
export const BUDGETS = ["до 50 000 ₽", "50–150 тыс. ₽", "150–500 тыс. ₽", "от 500 тыс. ₽", "Не определён"];
export const BRANDBOOK = ["Да", "Нет", "В процессе"];

const opt = (label: string, v: string) => (v ? [`${label}: ${v}`] : []);

const fmtDate = (iso: string) => (iso ? iso.split("-").reverse().join(".") : "");

export function buildBrief(d: BriefData): { text: string; href: string | null; subject: string } {
  const subject = `Бриф с сайта ProStyle — ${d.company}`;
  const build = (idea: string, sep: string) =>
    [
      "Контакты:",
      `Компания: ${d.company}`,
      `Контактное лицо: ${d.name}`,
      `Телефон: ${d.phone}`,
      ...opt("Email", d.email),
      ...opt("Город", d.city),
      "",
      "Задача:",
      `Что изготовить: ${d.kinds.join(", ")}`,
      `Тираж: ${d.qty}`,
      ...opt("Бюджет", d.budget),
      ...opt("Срок готовности", fmtDate(d.deadline)),
      ...opt("Повод/мероприятие", d.occasion),
      "",
      "Детали:",
      `Описание идеи: ${idea}`,
      ...opt("Брендирование", d.prints.join(", ")),
      ...opt("Брендбук/логотип", d.brandbook),
    ].join(sep);
  const url = (body: string) =>
    `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const text = build(d.idea, "\n");
  let idea = d.idea;
  let href: string | null = url(build(idea, "\r\n"));
  if (href.length > MAILTO_LIMIT) {
    while (idea && url(build(idea, "\r\n")).length > MAILTO_LIMIT) idea = idea.slice(0, Math.max(0, idea.length - 20));
    const h = url(build(idea ? `${idea}…` : "см. текст брифа (скопируйте с сайта)", "\r\n"));
    href = h.length <= MAILTO_LIMIT ? h : null;
  }
  return { text, href, subject };
}
