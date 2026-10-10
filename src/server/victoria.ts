import { json, query, type Row } from "./db";
import { aiEnabled, noDash, runWithCatalog, type Msg } from "./ai";
import { getOrderRow, type OrderContact } from "./orders";
import { KNOWLEDGE, STYLE } from "./persona";
import { AGENT } from "@/lib/chat/agent";
import type { CartItem } from "@/lib/cart/store";

/**
 * Виктория — персональный менеджер в чате заявки, отвечает через GPT (RouterAI) с поиском по всему каталогу.
 * Знает компанию, условия и состав заявки клиента; живой человеческий тон, советы и уточняющие вопросы.
 */
function systemPrompt(order: { number: string; name: string; company: string; items: CartItem[]; total: number; delivery: string; payment: string; comment: string | null; status: string }) {
  const items = order.items.map((i) => `- ${i.title} (арт. ${i.sku}) — ${i.qty} шт. × ${i.price} ₽${i.preorder ? ", под заказ" : ""}`).join("\n");
  return `Ты — ${AGENT.name}, персональный менеджер компании ProStyle. Ведёшь переписку с клиентом в чате его заявки в личном кабинете.

${STYLE}
- Обращайся к клиенту по имени${order.name ? ` (${order.name})` : ""}, но не в каждом сообщении.
- Предлагая товар, назови его, цену за штуку и дай ссылку из результатов поиска отдельной строкой.
- Если клиент прислал файлы (логотип, макет) — поблагодари и скажи, что передашь дизайнеру на расчёт нанесения и макет.

${KNOWLEDGE}

Заявка клиента № ${order.number}${order.company ? `, компания «${order.company}»` : ""}, статус: ${order.status}.
Состав:
${items || "- (пусто)"}
Сумма без нанесения: ${order.total} ₽. Доставка: ${order.delivery}. Оплата: ${order.payment}.${order.comment ? `\nКомментарий клиента: ${order.comment}` : ""}
Сегодня: ${new Date().toLocaleDateString("ru-RU", { timeZone: "Europe/Moscow", day: "numeric", month: "long", year: "numeric", weekday: "long" })}.`;
}

/** Ответы модели — простым текстом (чат не рендерит markdown). */
const plain = (s: string) =>
  s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|\s)\*(\S.*?)\*(?=\s|$)/g, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1: $2")
    .trim();

type MsgRow = Row & { id: number; role: string; text: string; files: unknown };

/** Ответ Виктории на последние сообщения чата (null — ИИ выключен или не ответил). */
export async function victoriaReply(number: string): Promise<string | null> {
  if (!aiEnabled()) return null;
  const row = await getOrderRow(number);
  if (!row) return null;
  const contact = json<OrderContact>(row.contact);
  const rows = await query<MsgRow>("SELECT id, role, text, files FROM messages WHERE order_number = ? ORDER BY id DESC LIMIT 24", [number]);
  const history: Msg[] = rows.reverse().map((m) => {
    const files = m.files ? json<{ name: string }[]>(m.files) : [];
    const text = [m.text, files.length ? `[приложены файлы: ${files.map((f) => f.name).join(", ")}]` : ""].filter(Boolean).join("\n");
    if (m.role === "user") return { role: "user", content: text };
    return { role: "assistant", content: m.role === "manager" ? `(ответ коллеги-менеджера) ${text}` : text };
  });
  const messages: Msg[] = [
    {
      role: "system",
      content: systemPrompt({
        number,
        name: contact.name?.split(" ")[0] ?? "",
        company: contact.company ?? "",
        items: json<CartItem[]>(row.items),
        total: Number(row.total),
        delivery: row.delivery,
        payment: row.payment,
        comment: row.comment,
        status: row.status,
      }),
    },
    ...history,
  ];
  const { text } = await runWithCatalog(messages, { withLinks: true, maxTokens: 700 });
  return text ? noDash(plain(text)) : null;
}
