import { rebuildFacets } from "./facets";
import { exec, getPool, query, type Row } from "./db";
import { slugify } from "@/lib/translit";

/**
 * Склад Oasis (api.oasiscatalog.com/v4), ключ — OASIS_API_KEY в /opt/prostyle/.env.
 *  — полная синхронизация (раз в сутки): категории + все товары постранично → oc_categories, oc_products, oc_product_categories;
 *  — быстрая (раз в час): цены и остатки одним запросом → oc_products.
 */
const API = "https://api.oasiscatalog.com/v4";
const PAGE = 500;
const FULL_FIELDS =
  "id,article,group_id,color_group_id,is_deleted,name,full_name,description,size,colors,rating,price,old_price,attributes,categories,images,updated_at,total_stock,stock_msk,brand_id";
const LIGHT_FIELDS = "id,price,old_price,total_stock,stock_msk,is_deleted";

/** Корни дерева Oasis: «Продукция» — основной каталог, «Праздники» и «ВИП» — подборки. */
export const ROOTS = { products: 2891, holidays: 2269, vip: 1906 } as const;

type OcCategory = { id: number; parent_id: number | null; root: number | null; level: number; slug: string; name: string; path: string };
type OcProduct = {
  id: string;
  article: string;
  group_id?: string;
  color_group_id?: string;
  is_deleted?: boolean;
  name: string;
  full_name?: string;
  description?: string;
  size?: string | null;
  colors?: unknown;
  rating?: number;
  price: string | number;
  old_price?: string | number | null;
  attributes?: unknown;
  categories?: number[];
  images?: unknown;
  updated_at?: string;
  total_stock?: number;
  stock_msk?: number;
  brand_id?: number | null;
};

export const normArticle = (a: string) => a.trim().toLowerCase();

async function api<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.OASIS_API_KEY;
  if (!key) throw new Error("OASIS_API_KEY не задан");
  const res = await fetch(`${API}/${path}?${new URLSearchParams({ key, format: "json", ...params })}`, { signal: AbortSignal.timeout(120_000), cache: "no-store" });
  if (res.status === 401) throw new Error("Oasis: неверный API-ключ");
  if (!res.ok) throw new Error(`Oasis ${path}: ответ ${res.status}`);
  return (await res.json()) as T;
}

const stockOf = (p: OcProduct) => {
  const total = Math.max(0, Number(p.total_stock) || 0);
  const msk = Math.max(0, Number(p.stock_msk ?? total) || 0);
  return { stock: msk, remote: Math.max(0, total - msk) };
};
const oldPriceOf = (p: OcProduct) => {
  const price = Number(p.price) || 0, old = Number(p.old_price) || 0;
  return old > price ? old : null;
};

export async function logStart(source: string) {
  return (await exec("INSERT INTO sync_log (source, started_at) VALUES (?, UTC_TIMESTAMP())", [source])).insertId;
}
export async function logEnd(id: number, items: number, error?: string) {
  await exec("UPDATE sync_log SET finished_at = UTC_TIMESTAMP(), items = ?, error = ? WHERE id = ?", [items, error ? error.slice(0, 2000) : null, id]);
}

const running: Record<string, Promise<{ items: number }> | null> = {};
/** Количество товаров в разделах (все склады): модели, как в выдаче, — размеры и цвета одной модели не множатся. */
export async function recountCategories() {
  await exec("UPDATE oc_categories SET product_count = 0");
  await exec(
    `UPDATE oc_categories c JOIN (SELECT pc.category_id, COUNT(DISTINCT COALESCE(p.color_group_id, p.id)) n FROM oc_product_categories pc JOIN oc_products p ON p.id = pc.product_id AND p.deleted = 0 GROUP BY pc.category_id) x
     ON x.category_id = c.id SET c.product_count = x.n`,
  );
}

/** Обложка карточки — первое фото (ссылка на крупное). */
export function coverFrom(images: unknown): string | null {
  const i = (Array.isArray(images) ? images : [])[0] as { big?: string; superbig?: string; small?: string } | undefined;
  return (i?.big || i?.superbig || i?.small || "").slice(0, 500) || null;
}

/** Описание, характеристики и фото — в oc_product_details. */
export async function saveDetails(rows: [string, string | null, string, string][]) {
  if (!rows.length) return;
  await exec(
    `INSERT INTO oc_product_details (id, description, attributes, images) VALUES ?
     ON DUPLICATE KEY UPDATE description = VALUES(description), attributes = VALUES(attributes), images = VALUES(images)`,
    [rows],
  );
}

export function single(name: string, fn: () => Promise<{ items: number }>) {
  if (!running[name]) running[name] = fn().finally(() => (running[name] = null));
  return running[name]!;
}

/** Полная синхронизация каталога. */
export function syncOasisCatalog(): Promise<{ items: number }> {
  return single("catalog", async () => {
    const log = await logStart("oasis-catalog");
    try {
      const cats = await api<OcCategory[]>("categories", { fields: "id,parent_id,root,level,slug,name,path" });
      const byId = new Map(cats.map((c) => [c.id, c]));
      await exec(
        `INSERT INTO oc_categories (id, parent_id, root, level, slug, name, path, sort) VALUES ?
         ON DUPLICATE KEY UPDATE parent_id = VALUES(parent_id), root = VALUES(root), level = VALUES(level), slug = VALUES(slug), name = VALUES(name), path = VALUES(path), sort = VALUES(sort)`,
        [cats.map((c, i) => [c.id, c.parent_id || null, c.root || null, c.level, c.slug.slice(0, 190), c.name.slice(0, 255), (c.path ?? "").slice(0, 500), i])],
      );
      const ancestors = (id: number) => {
        const out: number[] = [];
        for (let c = byId.get(id); c; c = c.parent_id ? byId.get(c.parent_id) : undefined) out.push(c.id);
        return out;
      };
      // Основной раздел для адреса: самый глубокий из «Продукции», иначе из «Праздников»/«ВИП».
      const primaryOf = (ids: number[]) => {
        const known = ids.map((id) => byId.get(id)).filter((c): c is OcCategory => !!c);
        for (const root of [ROOTS.products, ROOTS.holidays, ROOTS.vip]) {
          const own = known.filter((c) => c.root === root).sort((a, b) => b.level - a.level);
          if (own[0]) return own[0].id;
        }
        return known[0]?.id ?? null;
      };

      // Округляем до секунды: DATETIME в MySQL без миллисекунд, иначе «synced_at < started» верно для всех.
      const started = new Date(Math.floor(Date.now() / 1000) * 1000);
      let total = 0;
      for (let offset = 0; ; offset += PAGE) {
        const page = await api<OcProduct[]>("products", { fields: FULL_FIELDS, limit: String(PAGE), offset: String(offset) });
        if (!Array.isArray(page) || !page.length) break;
        const items = page.filter((p) => p.id && p.article);
        const rows = items.map((p) => {
          const s = stockOf(p);
          const ids = Array.isArray(p.categories) ? p.categories : [];
          return [
            String(p.id).slice(0, 32), String(p.article).slice(0, 64), p.group_id ?? null, p.color_group_id ?? null,
            slugify(p.name), String(p.name).slice(0, 400), p.full_name ? String(p.full_name).slice(0, 500) : null, coverFrom(p.images),
            Number(p.price) || 0, oldPriceOf(p), Number(p.rating) || 0, p.size ? String(p.size).slice(0, 64) : null,
            JSON.stringify(p.colors ?? []), JSON.stringify(ids),
            primaryOf(ids), p.brand_id ?? null, s.stock, s.remote, p.is_deleted ? 1 : 0,
            p.updated_at ? new Date(p.updated_at.replace(" ", "T") + "+03:00") : null, started,
          ];
        });
        if (rows.length) {
          await exec(
            `INSERT INTO oc_products (id, article, group_id, color_group_id, slug, name, full_name, cover, price, old_price, rating, size,
               colors, categories, primary_cat, brand_id, stock, remote, deleted, updated_at, synced_at) VALUES ?
             ON DUPLICATE KEY UPDATE article = VALUES(article), group_id = VALUES(group_id), color_group_id = VALUES(color_group_id), slug = VALUES(slug),
               name = VALUES(name), full_name = VALUES(full_name), cover = VALUES(cover), price = VALUES(price), old_price = VALUES(old_price),
               rating = VALUES(rating), size = VALUES(size), colors = VALUES(colors),
               categories = VALUES(categories), primary_cat = VALUES(primary_cat), brand_id = VALUES(brand_id), stock = VALUES(stock), remote = VALUES(remote),
               deleted = VALUES(deleted), updated_at = VALUES(updated_at), synced_at = VALUES(synced_at)`,
            [rows],
          );
          await saveDetails(items.map((p) => [String(p.id).slice(0, 32), p.description ?? null, JSON.stringify(p.attributes ?? []), JSON.stringify(p.images ?? [])]));
          const ids = rows.map((r) => r[0] as string);
          await exec("DELETE FROM oc_product_categories WHERE product_id IN (?)", [ids]);
          const links = page.flatMap((p) => [...new Set((p.categories ?? []).flatMap(ancestors))].map((c) => [String(p.id), c]));
          if (links.length) await exec("INSERT IGNORE INTO oc_product_categories (product_id, category_id) VALUES ?", [links]);
        }
        total += rows.length;
        if (page.length < PAGE) break;
      }
      if (total < 1000) throw new Error(`Oasis вернул подозрительно мало товаров: ${total}`);
      await exec("UPDATE oc_products SET deleted = 1, stock = 0, remote = 0 WHERE supplier = 'oasis' AND synced_at < ?", [started]);
      await recountCategories();
      await rebuildFacets();
      await logEnd(log, total);
      return { items: total };
    } catch (e) {
      await logEnd(log, 0, (e as Error).message);
      throw e;
    }
  });
}

/** Быстрая синхронизация: цены и остатки. */
export function syncOasis(): Promise<{ items: number }> {
  return single("stock", async () => {
    const log = await logStart("oasis");
    try {
      const list = await api<OcProduct[]>("products", { fields: LIGHT_FIELDS });
      if (!Array.isArray(list) || list.length < 1000) throw new Error("Oasis: неожиданный ответ по остаткам");
      const conn = await getPool().getConnection();
      try {
        await conn.query("CREATE TEMPORARY TABLE IF NOT EXISTS tmp_stock (id VARCHAR(32) PRIMARY KEY, price DECIMAL(12,2), old_price DECIMAL(12,2) NULL, stock INT, remote INT, deleted TINYINT(1))");
        await conn.query("TRUNCATE tmp_stock");
        const rows = list.filter((p) => p.id).map((p) => {
          const s = stockOf(p);
          return [String(p.id).slice(0, 32), Number(p.price) || 0, oldPriceOf(p), s.stock, s.remote, p.is_deleted ? 1 : 0];
        });
        for (let i = 0; i < rows.length; i += 2000) await conn.query("INSERT IGNORE INTO tmp_stock VALUES ?", [rows.slice(i, i + 2000)]);
        await conn.query(
          `UPDATE oc_products p JOIN tmp_stock t ON t.id = p.id
           SET p.price = t.price, p.old_price = t.old_price, p.stock = t.stock, p.remote = t.remote, p.deleted = t.deleted`,
        );
        await conn.query("UPDATE oc_products p LEFT JOIN tmp_stock t ON t.id = p.id SET p.deleted = 1, p.stock = 0, p.remote = 0 WHERE p.supplier = 'oasis' AND t.id IS NULL");
        await conn.query("DROP TEMPORARY TABLE IF EXISTS tmp_stock");
      } finally {
        conn.release();
      }
      await logEnd(log, list.length);
      return { items: list.length };
    } catch (e) {
      await logEnd(log, 0, (e as Error).message);
      throw e;
    }
  });
}

export type LiveStock = { price: number; oldPrice: number | null; stock: number; remote: number; deleted: boolean };

/** Живые цены/остатки по артикулам. */
export async function liveByArticles(articles: string[]): Promise<Record<string, LiveStock>> {
  const list = [...new Set(articles.map(normArticle).filter(Boolean))].slice(0, 300);
  if (!list.length) return {};
  const rows = await query<Row & { article: string; price: string; old_price: string | null; stock: number; remote: number; deleted: number }>(
    "SELECT LOWER(article) article, price, old_price, stock, remote, deleted FROM oc_products WHERE article IN (?)",
    [list],
  );
  return Object.fromEntries(
    rows.map((r) => [r.article, { price: Number(r.price), oldPrice: r.old_price ? Number(r.old_price) : null, stock: r.stock, remote: r.remote, deleted: !!r.deleted }]),
  );
}

export async function lastSync() {
  const one = async (source: string) => {
    const [r] = await query<Row & { started_at: Date; finished_at: Date | null; items: number; error: string | null }>(
      "SELECT * FROM sync_log WHERE source = ? ORDER BY id DESC LIMIT 1",
      [source],
    );
    const [ok] = await query<Row & { finished_at: Date }>(
      "SELECT finished_at FROM sync_log WHERE source = ? AND error IS NULL AND finished_at IS NOT NULL ORDER BY id DESC LIMIT 1",
      [source],
    );
    return {
      last: r ? { startedAt: r.started_at.toISOString(), finishedAt: r.finished_at?.toISOString() ?? null, items: r.items, error: r.error } : null,
      lastSuccessAt: ok ? ok.finished_at.toISOString() : null,
    };
  };
  const counts = await query<Row & { supplier: string; total: number; active: number; in_stock: number }>(
    "SELECT supplier, COUNT(*) total, SUM(deleted = 0) active, SUM(deleted = 0 AND stock + remote > 0) in_stock FROM oc_products GROUP BY supplier",
  );
  const cnt = counts.reduce((a, r) => ({ total: a.total + Number(r.total), active: a.active + Number(r.active ?? 0), in_stock: a.in_stock + Number(r.in_stock ?? 0) }), { total: 0, active: 0, in_stock: 0 });
  const bySupplier = Object.fromEntries(counts.map((r) => [r.supplier, { total: Number(r.total), active: Number(r.active ?? 0), inStock: Number(r.in_stock ?? 0) }]));
  return {
    stock: await one("oasis"),
    catalog: await one("oasis-catalog"),
    giftsStock: await one("gifts"),
    giftsCatalog: await one("gifts-catalog"),
    total: Number(cnt?.total ?? 0),
    active: Number(cnt?.active ?? 0),
    inStock: Number(cnt?.in_stock ?? 0),
    bySupplier,
  };
}
