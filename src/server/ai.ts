import { listProducts } from "./catalog";
import type { Product } from "@/lib/catalog/types";

/**
 * ИИ-помощник поиска: модель через шлюз RouterAI (OpenAI-совместимый API, https://routerai.ru/api/v1).
 * Ключ и модель — ROUTERAI_API_KEY и ROUTERAI_MODEL в /opt/prostyle/.env. Товары модель берёт только из нашего
 * каталога через инструмент search_catalog. Без ключа помощник работает как поиск по каталогу.
 */
const API = process.env.ROUTERAI_BASE_URL || "https://routerai.ru/api/v1";
const MAX_STEPS = 4;

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type AiAnswer = { reply: string; products: Product[]; ai: boolean };

export const aiEnabled = () => !!(process.env.ROUTERAI_API_KEY && process.env.ROUTERAI_MODEL);

const SYSTEM = `Ты — ИИ-помощник интернет-магазина ProStyle (Тюмень): корпоративные подарки, сувениры и промо-продукция с нанесением логотипа для компаний (B2B, минимальный заказ от 10 000 ₽, доставка по России).
Помогаешь подобрать товары: уточняешь задачу (повод, аудитория, бюджет на единицу, тираж, сроки), если её не хватает, и ищешь в каталоге.
Правила:
- Товары, цены и наличие — только из результатов инструмента search_catalog. Ничего не выдумывай. Если не нашлось — переформулируй запрос (синонимы, более общий запрос) и поищи снова.
- Для поиска передавай короткие запросы из 1–3 слов в именительном падеже («термокружка», «power bank», «ежедневник»).
- Отвечай по-русски, коротко и по делу: 2–5 предложений, без markdown-таблиц. Подходящие товары кратко назови — их карточки покажутся пользователю под ответом.
- Цены указаны за штуку без нанесения. Стоимость нанесения, макет и сроки рассчитывает менеджер — предложи оставить заявку или позвонить +7 (3452) 550 995.
- Не обсуждай темы, не связанные с подбором подарков и заказом.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_catalog",
      description: "Поиск товаров в каталоге ProStyle по названию. Возвращает до 8 товаров с ценой за штуку и остатком.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Короткий запрос: 1–3 слова, например «термокружка» или «рюкзак для ноутбука»" },
          price_max: { type: "number", description: "Максимальная цена за штуку, ₽" },
          price_min: { type: "number", description: "Минимальная цена за штуку, ₽" },
          in_stock: { type: "boolean", description: "Только в наличии" },
        },
        required: ["query"],
      },
    },
  },
];

/** Поиск для помощника: сначала все слова, иначе — по каждому слову (берём лучшие). */
export async function searchCatalog(args: { query?: string; price_max?: number; price_min?: number; in_stock?: boolean }, limit = 8): Promise<Product[]> {
  const q = String(args.query ?? "").replace(/[^\p{L}\p{N}\s.-]/gu, " ").trim().slice(0, 80);
  if (!q) return [];
  const base = { priceTo: Number(args.price_max) || undefined, priceFrom: Number(args.price_min) || undefined, inStock: args.in_stock !== false, perPage: limit };
  const all = await listProducts({ ...base, q });
  if (all.items.length) return all.items;
  // Слова длиннее 3 букв, обрезанные до основы (кружки → круж), чтобы находить разные формы.
  const words = [...new Set(q.toLowerCase().split(/\s+/).filter((w) => w.length > 3).map((w) => (w.length > 6 ? w.slice(0, w.length - 2) : w)))].slice(0, 3);
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const w of words) {
    for (const p of (await listProducts({ ...base, q: w })).items) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
  }
  return out.slice(0, limit);
}

const brief = (p: Product) => ({ title: p.title, article: p.sku, price: p.priceFrom, stock: p.stock ?? 0 });

type Msg = { role: string; content: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[]; tool_call_id?: string };

async function complete(messages: Msg[]) {
  const res = await fetch(`${API}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.ROUTERAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.ROUTERAI_MODEL, messages, tools: TOOLS, temperature: 0.3, max_tokens: 600 }),
    signal: AbortSignal.timeout(45_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RouterAI: ответ ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { choices?: { message?: Msg }[] };
  const msg = data.choices?.[0]?.message;
  if (!msg) throw new Error("RouterAI: пустой ответ");
  return msg;
}

/** Ответ помощника на диалог. */
export async function answer(history: ChatTurn[]): Promise<AiAnswer> {
  const last = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!aiEnabled()) {
    const products = await searchCatalog({ query: last });
    return {
      ai: false,
      products,
      reply: products.length
        ? `Вот что нашлось по запросу «${last}». Нужен подбор под задачу и бюджет — оставьте заявку, менеджер поможет.`
        : `По запросу «${last}» ничего не нашлось. Попробуйте другое слово или артикул — или позвоните нам: +7 (3452) 550 995.`,
    };
  }
  const messages: Msg[] = [{ role: "system", content: SYSTEM }, ...history.map((m) => ({ role: m.role, content: m.content }))];
  const found = new Map<string, Product>();
  for (let step = 0; step < MAX_STEPS; step++) {
    const msg = await complete(messages);
    const calls = msg.tool_calls ?? [];
    if (!calls.length) {
      return { ai: true, reply: (msg.content ?? "").trim() || "Не удалось сформулировать ответ — попробуйте переформулировать вопрос.", products: [...found.values()].slice(0, 8) };
    }
    messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: calls });
    for (const call of calls) {
      let result: unknown = { error: "неизвестный инструмент" };
      if (call.function.name === "search_catalog") {
        let args = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          // некорректный JSON от модели — ищем без параметров
        }
        const items = await searchCatalog(args);
        for (const p of items) found.set(p.id, p);
        result = items.length ? items.map(brief) : "Ничего не найдено";
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  return { ai: true, reply: "Вот что удалось подобрать. Уточните задачу или бюджет — подберу точнее.", products: [...found.values()].slice(0, 8) };
}
