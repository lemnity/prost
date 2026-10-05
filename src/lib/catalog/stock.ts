// Остатки и виды нанесения (выгрузка моделей карточек prostyle.gifts).
// Только для сервера: страницы товаров и вычисление полей листинга при сборке.
import raw from "@/data/catalog-stock.json";

export type StockRow = {
  size: string;
  /** На складе. */
  stock: number;
  /** Доступно. */
  free: number;
  /** Удалённый склад (на оригинале — «Предзаказ»). */
  remote: number;
  remoteFree: number;
  onDemand: boolean;
};

export type StockInfo = { rows: StockRow[]; prints: string[] };

const data = raw as unknown as Record<string, StockInfo>;

export function getStock(url: string): StockInfo | null {
  const s = data[url];
  return s && s.rows.length ? s : null;
}

/** Сводка для листинга и корзины: доступно суммарно и есть ли поставка под заказ. */
export function summarizeStock(s: StockInfo | null): { free: number; preorder: boolean } | null {
  if (!s) return null;
  const free = s.rows.reduce((n, r) => n + r.free, 0);
  const remote = s.rows.reduce((n, r) => n + r.remote, 0);
  return { free, preorder: free <= 0 && remote > 0 };
}

const up = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Приведение видов нанесения к общим группам. */
export function normalizePrint(name: string): string {
  const s = name.replace(/\s+/g, " ").trim().toLowerCase();
  if (/тампопечат/.test(s)) return "Тампопечать";
  if (/^шелк/.test(s)) return "Шелкография";
  if (/гравировк/.test(s) && !/шильд/.test(s)) return "Лазерная гравировка";
  if (/^(уф|uv)[\s-]|круговая уф/.test(s)) return "УФ-печать";
  if (/вышивк|пришив|термоклеев/.test(s)) return "Вышивка";
  if (/сублимац/.test(s)) return "Сублимация";
  if (/трансфер|флекстран|^флекс$/.test(s)) return "Трансфер";
  if (/наклейк/.test(s)) return "Наклейка";
  if (/цифровая печать|офсетная вставка/.test(s)) return "Цифровая печать";
  return up(s);
}

export function normalizePrints(s: StockInfo | null): string[] {
  if (!s) return [];
  return [...new Set(s.prints.map(normalizePrint).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
}
