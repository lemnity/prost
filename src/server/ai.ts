import { listProducts } from "./catalog";
import type { Product } from "@/lib/catalog/types";
import { INTRO, KNOWLEDGE, STYLE } from "./persona";
import { weather } from "./weather";

/**
 * ИИ-помощник поиска: модель через шлюз RouterAI (OpenAI-совместимый API, https://routerai.ru/api/v1).
 * Ключ и модель — ROUTERAI_API_KEY и ROUTERAI_MODEL в /opt/prostyle/.env. Товары модель берёт только из нашего
 * каталога через инструмент search_catalog. Без ключа помощник работает как поиск по каталогу.
 */
const API = process.env.ROUTERAI_BASE_URL || "https://routerai.ru/api/v1";
const MAX_STEPS = 4;

export type ChatTurn = { role: "user" | "assistant"; content: string };
/** Часть ответа — отдельное сообщение в чате (текст и, если есть, карточки товаров). */
export type AiPart = { text: string; products: Product[] };
export type AiAnswer = { reply: string; products: Product[]; parts: AiPart[]; ai: boolean };

/** Без длинного и короткого тире: только обычный дефис. */
export const noDash = (s: string) => s.replace(/\s*—\s*/g, " - ").replace(/–/g, "-");

export const aiEnabled = () => !!(process.env.ROUTERAI_API_KEY && process.env.ROUTERAI_MODEL);

const SYSTEM = `${INTRO} Ты отвечаешь посетителю сайта в окне поиска: помогаешь подобрать корпоративные подарки и сувениры из каталога.
Ты уже поздоровалась и представилась в начале диалога — не здоровайся и не представляйся снова, сразу переходи к делу.

${STYLE}
- Цены за штуку без нанесения. Чтобы оформить заказ, посетитель добавляет товары в корзину и отправляет заявку, после этого ты продолжишь работу с ним в чате заявки: рассчитаешь нанесение и макет.

Формат ответа: только JSON без пояснений и без markdown, ровно такой:
{"text": "...", "picks": ["артикул", ...], "more_text": "...", "more": ["артикул", ...], "question": "..."}
- text: 1–2 живых предложения по сути запроса. НЕ перечисляй в тексте товары и цены, их покажут карточками.
- picks: до 4 артикулов лучших товаров из результатов search_catalog (пусто, если товары не нужны, например в бытовом разговоре).
- more_text и more: дополнительная рекомендация, другая идея под ту же задачу (например «Ещё рекомендую обратить внимание на эти варианты:») и до 4 артикулов; если нечего добавить, пустая строка и пустой список.
- question: завершающее сообщение: уточняющий вопрос по задаче или предложение помочь ещё («Могу ещё что-то подсказать?»).
- Артикулы бери только из результатов поиска, не выдумывай.

${KNOWLEDGE}
Сегодня: {TODAY}.`;

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
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Текущая погода и прогноз на сегодня и завтра в городе. Если город не назван — Тюмень.",
      parameters: { type: "object", properties: { city: { type: "string", description: "Город, например «Тюмень» или «Москва»" } } },
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

export type Msg = { role: string; content: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[]; tool_call_id?: string };

async function complete(messages: Msg[], maxTokens: number) {
  const res = await fetch(`${API}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.ROUTERAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.ROUTERAI_MODEL, messages, tools: TOOLS, temperature: 0.5, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(45_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RouterAI: ответ ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { choices?: { message?: Msg }[] };
  const msg = data.choices?.[0]?.message;
  if (!msg) throw new Error("RouterAI: пустой ответ");
  return msg;
}

/**
 * Диалог с моделью и поиском по каталогу: модель может несколько раз вызвать search_catalog, затем отвечает текстом.
 * withLinks — в результатах поиска отдаём ссылки на товары (для чата менеджера, где карточек нет).
 */
export async function runWithCatalog(messages: Msg[], opts: { withLinks?: boolean; maxTokens?: number } = {}): Promise<{ text: string; products: Product[] }> {
  const found = new Map<string, Product>();
  const site = process.env.SITE_URL || "https://prostyle.agency";
  for (let step = 0; step < MAX_STEPS; step++) {
    const msg = await complete(messages, opts.maxTokens ?? 600);
    const calls = msg.tool_calls ?? [];
    if (!calls.length) return { text: (msg.content ?? "").trim(), products: [...found.values()] };
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
        result = items.length ? items.map((p) => ({ ...brief(p), ...(opts.withLinks ? { url: site + p.url } : {}) })) : "Ничего не найдено";
      }
      if (call.function.name === "get_weather") {
        try {
          const args = JSON.parse(call.function.arguments || "{}") as { city?: string };
          result = await weather(args.city);
        } catch {
          result = { error: "Погода сейчас недоступна" };
        }
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  return { text: "", products: [...found.values()] };
}

/** Ответ помощника на диалог. */
export async function answer(history: ChatTurn[]): Promise<AiAnswer> {
  const last = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!aiEnabled()) {
    const products = await searchCatalog({ query: last });
    const reply = products.length
        ? `Вот что нашлось по запросу «${last}». Нужен подбор под задачу и бюджет? Опишите её, подскажу.`
        : `По запросу «${last}» ничего не нашлось. Попробуйте другое слово или артикул или опишите задачу, подберу варианты.`;
    return { ai: false, products, reply, parts: [{ text: reply, products }] };
  }
  const today = new Date().toLocaleDateString("ru-RU", { timeZone: "Europe/Moscow", day: "numeric", month: "long", year: "numeric" });
  // В истории — только тексты прошлых ответов (без JSON), модель отвечает новым JSON.
  const messages: Msg[] = [{ role: "system", content: SYSTEM.replace("{TODAY}", today) }, ...history.map((m) => ({ role: m.role, content: m.content }))];
  const { text, products } = await runWithCatalog(messages);
  const parts = toParts(text, products);
  return { ai: true, parts, reply: parts.map((p) => p.text).join("\n\n"), products: parts.flatMap((p) => p.products) };
}

type Structured = { text?: string; picks?: string[]; more_text?: string; more?: string[]; question?: string };

/** JSON модели → сообщения: основное с карточками, «ещё рекомендую» с карточками, завершающий вопрос. */
function toParts(raw: string, found: Product[]): AiPart[] {
  const bySku = new Map(found.map((p) => [p.sku.trim().toLowerCase(), p]));
  const pick = (list?: string[], used = new Set<string>()) =>
    (Array.isArray(list) ? list : [])
      .map((a) => bySku.get(String(a).trim().toLowerCase()))
      .filter((p): p is Product => !!p && !used.has(p.id) && !!used.add(p.id))
      .slice(0, 4);
  let data: Structured | null = null;
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  try {
    data = json ? (JSON.parse(json) as Structured) : null;
  } catch {
    data = null;
  }
  if (!data) {
    // Модель ответила обычным текстом — одно сообщение и найденные товары.
    const text = noDash(raw.trim()) || "Вот что удалось подобрать.";
    return [{ text, products: found.slice(0, 4) }];
  }
  const used = new Set<string>();
  const picks = pick(data.picks, used);
  const more = pick(data.more, used);
  const parts: AiPart[] = [];
  const main = noDash(String(data.text ?? "").trim());
  if (main || picks.length) parts.push({ text: main || "Вот что подобрала:", products: picks });
  const moreText = noDash(String(data.more_text ?? "").trim());
  if (more.length) parts.push({ text: moreText || "Ещё рекомендую обратить внимание:", products: more });
  const question = noDash(String(data.question ?? "").trim());
  if (question) parts.push({ text: question, products: [] });
  return parts.length ? parts : [{ text: "Расскажите чуть подробнее о задаче, и я подберу варианты.", products: [] }];
}
