import { exec, query, type Row } from "./db";

/**
 * Склад Oasis (api.oasiscatalog.com/v4). Ключ — OASIS_API_KEY в /opt/prostyle/.env.
 * Синхронизация раз в час (systemd-таймер → POST /api/internal/oasis-sync): цены и остатки
 * всех товаров склада складываются в таблицу oasis_products (ключ — артикул).
 */
const API = "https://api.oasiscatalog.com/v4";
const FIELDS = "id,article,group_id,name,price,old_price,total_stock,stock_msk,is_deleted,is_stopped";

type OasisProduct = {
  id: string;
  article: string;
  group_id?: string;
  name: string;
  price: string | number;
  old_price?: string | number | null;
  total_stock?: number;
  stock_msk?: number;
  is_deleted?: boolean;
  is_stopped?: boolean;
};

export const normArticle = (a: string) => a.trim().toLowerCase();

async function fetchProducts(): Promise<OasisProduct[]> {
  const key = process.env.OASIS_API_KEY;
  if (!key) throw new Error("OASIS_API_KEY не задан");
  const url = `${API}/products?${new URLSearchParams({ key, format: "json", fields: FIELDS })}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000), cache: "no-store" });
  if (res.status === 401) throw new Error("Oasis: неверный API-ключ");
  if (!res.ok) throw new Error(`Oasis: ответ ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Oasis: неожиданный формат ответа");
  return data as OasisProduct[];
}

let running: Promise<{ items: number }> | null = null;

/** Полная синхронизация цен и остатков. Параллельные вызовы ждут уже идущую. */
export function syncOasis(): Promise<{ items: number }> {
  if (running) return running;
  running = (async () => {
    const log = await exec("INSERT INTO sync_log (source, started_at) VALUES ('oasis', UTC_TIMESTAMP())");
    try {
      const products = await fetchProducts();
      const now = new Date();
      const rows = products
        .filter((p) => p.article && p.id)
        .map((p) => {
          const total = Math.max(0, Number(p.total_stock) || 0);
          const msk = Math.max(0, Number(p.stock_msk ?? total) || 0);
          const price = Number(p.price) || 0;
          const old = Number(p.old_price) || 0;
          return [
            normArticle(p.article).slice(0, 64),
            String(p.id).slice(0, 32),
            p.group_id ? String(p.group_id).slice(0, 32) : null,
            String(p.name ?? "").slice(0, 400),
            price,
            old > price ? old : null,
            msk,
            Math.max(0, total - msk),
            // is_stopped — производство остановлено, но остатки продаются; снят только is_deleted.
            p.is_deleted ? 1 : 0,
            now,
          ];
        });
      for (let i = 0; i < rows.length; i += 1000) {
        const chunk = rows.slice(i, i + 1000);
        await exec(
          `INSERT INTO oasis_products (article, oasis_id, group_id, name, price, old_price, stock, remote, deleted, synced_at) VALUES ?
           ON DUPLICATE KEY UPDATE oasis_id = VALUES(oasis_id), group_id = VALUES(group_id), name = VALUES(name), price = VALUES(price),
             old_price = VALUES(old_price), stock = VALUES(stock), remote = VALUES(remote), deleted = VALUES(deleted), synced_at = VALUES(synced_at)`,
          [chunk],
        );
      }
      // Пропавшие из выгрузки — сняты с продажи.
      await exec("UPDATE oasis_products SET deleted = 1, stock = 0, remote = 0 WHERE synced_at < ?", [now]);
      await exec("UPDATE sync_log SET finished_at = UTC_TIMESTAMP(), items = ? WHERE id = ?", [rows.length, log.insertId]);
      return { items: rows.length };
    } catch (e) {
      await exec("UPDATE sync_log SET finished_at = UTC_TIMESTAMP(), error = ? WHERE id = ?", [String((e as Error).message).slice(0, 2000), log.insertId]);
      throw e;
    }
  })().finally(() => {
    running = null;
  });
  return running;
}

export type LiveStock = { price: number; oldPrice: number | null; stock: number; remote: number; deleted: boolean };

/** Живые цены/остатки по артикулам. */
export async function liveByArticles(articles: string[]): Promise<Record<string, LiveStock>> {
  const list = [...new Set(articles.map(normArticle).filter(Boolean))].slice(0, 300);
  if (!list.length) return {};
  const rows = await query<Row & { article: string; price: string; old_price: string | null; stock: number; remote: number; deleted: number }>(
    "SELECT article, price, old_price, stock, remote, deleted FROM oasis_products WHERE article IN (?)",
    [list],
  );
  return Object.fromEntries(
    rows.map((r) => [r.article, { price: Number(r.price), oldPrice: r.old_price ? Number(r.old_price) : null, stock: r.stock, remote: r.remote, deleted: !!r.deleted }]),
  );
}

export async function lastSync() {
  const [r] = await query<Row & { started_at: Date; finished_at: Date | null; items: number; error: string | null }>(
    "SELECT * FROM sync_log WHERE source = 'oasis' ORDER BY id DESC LIMIT 1",
  );
  const [ok] = await query<Row & { finished_at: Date; items: number }>(
    "SELECT finished_at, items FROM sync_log WHERE source = 'oasis' AND error IS NULL AND finished_at IS NOT NULL ORDER BY id DESC LIMIT 1",
  );
  const [cnt] = await query<Row & { total: number; active: number; in_stock: number }>(
    "SELECT COUNT(*) total, SUM(deleted = 0) active, SUM(deleted = 0 AND stock + remote > 0) in_stock FROM oasis_products",
  );
  return {
    last: r ? { startedAt: r.started_at.toISOString(), finishedAt: r.finished_at?.toISOString() ?? null, items: r.items, error: r.error } : null,
    lastSuccessAt: ok ? ok.finished_at.toISOString() : null,
    total: Number(cnt?.total ?? 0),
    active: Number(cnt?.active ?? 0),
    inStock: Number(cnt?.in_stock ?? 0),
  };
}
