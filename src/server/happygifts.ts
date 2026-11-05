import sax from "sax";
import { rebuildFacets } from "./facets";
import { exec, getPool, query, type Row } from "./db";
import { HAPPYGIFTS_MAP } from "./happygifts-map";
import { coverFrom, heavy, logEnd, logStart, recountCategories, saveDetails, single } from "./oasis";
import { slugify } from "@/lib/translit";

/**
 * Склад Happy Gifts (happygifts.ru): API https://happygifts.ru/http/api.php, POST с Basic-авторизацией —
 * HAPPYGIFTS_LOGIN / HAPPYGIFTS_PASSWORD (логин и пароль кабинета) в /opt/prostyle/.env.
 * Документация — в кабинете партнёра: /gd_cab/personal/teh/document_api.html.
 *  — полная синхронизация (раз в сутки, ночью): type=all (~5 МБ) → разделы, товары, варианты, фото, характеристики;
 *  — быстрая (до 4 раз в день, как просит поставщик): type=amount (~0,7 МБ) → цены и остатки.
 * Модель — <Item> (color_group_id «hh<id>»), вариант — <SubItem> (id «h<id>»), цвет — group_id «h<модель>-<код цвета>».
 * Цена — <Price> (розница с НДС, как на их сайте); <PriceDiscount> — скидка партнёра, на сайте её не показываем.
 */
const API = "https://happygifts.ru/http/api.php";
const SITE = "https://happygifts.ru";
const SUPPLIER = "happygifts";
const BATCH = 300;
/** Склады, остаток которых — «в наличии»: центральный и городские. «В пути» — как удалённый склад; образцы и производство не считаем. */
const STORES = ["Center", "StPeters", "Novosibi", "Ekb", "Kazan", "NijniNovgorod", "Samara", "Rostov", "Krasnoyarsk", "Perm", "Tumen", "Ufa", "Irkutsk", "Vladivos", "Khabarovsk", "Voroneg", "Krasnodar"];

const pid = (id: string) => `h${id}`;

async function open(type: "all" | "amount"): Promise<Response> {
  // Для отладки: HAPPYGIFTS_DIR — папка с заранее скачанными all.xml / amount.xml.
  if (process.env.HAPPYGIFTS_DIR) {
    const { createReadStream } = await import("node:fs");
    const { Readable } = await import("node:stream");
    return new Response(Readable.toWeb(createReadStream(`${process.env.HAPPYGIFTS_DIR}/${type}.xml`)) as ReadableStream);
  }
  const login = process.env.HAPPYGIFTS_LOGIN, password = process.env.HAPPYGIFTS_PASSWORD;
  if (!login || !password) throw new Error("HAPPYGIFTS_LOGIN / HAPPYGIFTS_PASSWORD не заданы");
  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}` },
    body: new URLSearchParams({ type }),
    signal: AbortSignal.timeout(600_000), // ответ готовится у них около минуты
    cache: "no-store",
  });
  if (!res.ok || !res.body) throw new Error(`Happy Gifts ${type}: ответ ${res.status}`);
  return res;
}

/** Мини-DOM узла XML. */
type El = { name: string; text: string; kids: El[] };
const kid = (e: El | undefined, name: string) => e?.kids.find((k) => k.name === name);
const kidsOf = (e: El | undefined, name: string) => e?.kids.filter((k) => k.name === name) ?? [];
const txt = (e: El | undefined, name: string) => kid(e, name)?.text.trim() ?? "";
const num = (e: El | undefined, name: string) => Math.max(0, Number(txt(e, name)) || 0);

/**
 * Потоковый разбор: элементы, для которых pick(имя, глубина) истинно (корень — глубина 1), собираются в мини-DOM
 * и передаются в onItem. Остальной документ в памяти не держим.
 */
async function streamItems(res: Response, pick: (name: string, level: number) => boolean, onItem: (e: El) => void, afterChunk?: () => Promise<void>) {
  const parser = sax.parser(true, { trim: false, normalize: false });
  let level = 0;
  let cur: El[] = [];
  let error: Error | null = null;
  parser.onerror = (e) => {
    error = e;
  };
  parser.onopentag = (t) => {
    level++;
    const el: El = { name: t.name, text: "", kids: [] };
    if (cur.length) {
      cur[cur.length - 1].kids.push(el);
      cur.push(el);
    } else if (pick(t.name, level)) cur = [el];
  };
  parser.ontext = parser.oncdata = (t) => {
    if (cur.length) cur[cur.length - 1].text += t;
  };
  parser.onclosetag = () => {
    level--;
    if (!cur.length) return;
    const el = cur.pop()!;
    if (!cur.length) onItem(el);
  };
  const decoder = new TextDecoder();
  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
    parser.write(decoder.decode(chunk, { stream: true }));
    if (error) throw error;
    if (afterChunk) await afterChunk();
  }
  parser.close();
  if (error) throw error;
}

/** Разделы Happy Gifts: <Group>, <SUB_Group>, <Sub_child_group>… — любой узел с <ID> и <NAME>; вложенность — родитель. */
function readGroups(root: El) {
  const pages = new Map<string, { name: string; parent: string | null }>();
  const walk = (e: El, parent: string | null) => {
    for (const g of e.kids) {
      const id = txt(g, "ID");
      if (!id || !kid(g, "NAME")) continue;
      pages.set(id, { name: txt(g, "NAME"), parent });
      walk(g, id);
    }
  };
  walk(root, null);
  return pages;
}

/**
 * Сопоставление разделов: заводим разделы в category_map (для будущей страницы «Разделы складов»).
 * Итог для раздела: ручной выбор (auto = 0) → значение HAPPYGIFTS_MAP → сопоставление родителя.
 */
async function categoryResolver(pages: Map<string, { name: string; parent: string | null }>) {
  const label = (id: string) => {
    const p = pages.get(id)!;
    const parent = p.parent ? pages.get(p.parent) : undefined;
    return parent ? `${parent.name} / ${p.name}` : p.name;
  };
  const rows = [...pages.keys()].map((id) => [SUPPLIER, id, label(id).slice(0, 255), HAPPYGIFTS_MAP[Number(id)] ?? null, 1]);
  if (rows.length) {
    await exec(
      `INSERT INTO category_map (supplier, supplier_cat, supplier_name, category_id, auto) VALUES ?
       ON DUPLICATE KEY UPDATE supplier_name = VALUES(supplier_name), category_id = IF(auto = 1, VALUES(category_id), category_id)`,
      [rows],
    );
  }
  const manual = new Map(
    (await query<Row & { supplier_cat: string; category_id: number | null }>("SELECT supplier_cat, category_id FROM category_map WHERE supplier = ? AND auto = 0", [SUPPLIER])).map((r) => [
      r.supplier_cat,
      r.category_id,
    ]),
  );
  return (id: string): number | null => {
    for (let g: string | null = id, i = 0; g && i < 8; g = pages.get(g)?.parent ?? null, i++) {
      if (manual.has(g)) return manual.get(g) ?? null;
      if (Number(g) in HAPPYGIFTS_MAP) return HAPPYGIFTS_MAP[Number(g)];
    }
    return null;
  };
}

/** Описание из HTML поставщика: только текст и переносы строк. */
function cleanDescription(html: string): string {
  return html
    .replace(/<\/(p|div|li)>/gi, "<br>")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<(?!br\b)[^>]+>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .replace(/^(\s*<br\s*\/?>)+|(<br\s*\/?>\s*)+$/gi, "")
    .trim();
}

const list = (s: string) => [...new Set(s.split(";").map((x) => x.trim()).filter(Boolean))];
const stockOf = (s: El) => ({ stock: STORES.reduce((n, k) => n + num(s, `FreeQuantity${k}`), 0), remote: num(s, "FreeQuantityInTheWay") });
const priceOf = (s: El) => Math.round((Number(txt(s, "Price")) || 0) * 100) / 100;

type CatInfo = { id: number; parent_id: number | null };

/** Полная синхронизация каталога Happy Gifts. */
export function syncHappyGiftsCatalog(): Promise<{ items: number }> {
  return heavy("happygifts-catalog", async () => {
    const log = await logStart("happygifts-catalog");
    try {
      const cats = await query<Row & CatInfo>("SELECT id, parent_id FROM oc_categories");
      const byId = new Map(cats.map((c) => [c.id, c]));
      const ancestors = (id: number) => {
        const out: number[] = [];
        for (let c = byId.get(id); c; c = c.parent_id ? byId.get(c.parent_id) : undefined) out.push(c.id);
        return out;
      };

      const started = new Date(Math.floor(Date.now() / 1000) * 1000);
      let groups: Promise<(id: string) => number | null> | null = null;
      let queue: El[] = [];
      let rows: unknown[][] = [];
      let linkRows: [string, number][] = [];
      let details: [string, string | null, string, string][] = [];
      let total = 0;

      const flush = async () => {
        if (!rows.length) return;
        const batch = rows, batchLinks = linkRows, batchDetails = details;
        rows = [];
        linkRows = [];
        details = [];
        await exec(
          `INSERT INTO oc_products (id, supplier, article, group_id, color_group_id, slug, name, full_name, cover, price, old_price, rating, size,
             colors, categories, primary_cat, brand_id, stock, remote, deleted, is_new, updated_at, synced_at) VALUES ?
           ON DUPLICATE KEY UPDATE supplier = VALUES(supplier), article = VALUES(article), group_id = VALUES(group_id), color_group_id = VALUES(color_group_id),
             slug = VALUES(slug), name = VALUES(name), full_name = VALUES(full_name), cover = VALUES(cover), price = VALUES(price),
             old_price = VALUES(old_price), size = VALUES(size), colors = VALUES(colors),
             categories = VALUES(categories), primary_cat = VALUES(primary_cat), stock = VALUES(stock), remote = VALUES(remote), deleted = 0,
             is_new = VALUES(is_new), updated_at = VALUES(updated_at), synced_at = VALUES(synced_at)`,
          [batch],
        );
        await saveDetails(batchDetails);
        await exec("DELETE FROM oc_product_categories WHERE product_id IN (?)", [batch.map((r) => r[0])]);
        if (batchLinks.length) await exec("INSERT IGNORE INTO oc_product_categories (product_id, category_id) VALUES ?", [batchLinks]);
      };

      /** Модель (<Item>) → строки вариантов. */
      const addItem = (e: El, resolve: (id: string) => number | null) => {
        const ours = resolve(txt(e, "GROUP_ID"));
        if (ours === null || !byId.has(ours)) return; // раздел не выводим или его нет в дереве
        const model = txt(e, "ID");
        const linked = ancestors(ours);
        const attrsBase = [
          { name: "Бренд", value: txt(e, "BrendName") },
          { name: "Материал", value: txt(e, "Material") || list(txt(e, "MATERIALS")).join(", ") },
        ];
        for (const s of kidsOf(kid(e, "SubItems"), "SubItem")) {
          const id = txt(s, "ID");
          const price = priceOf(s);
          if (!id || price <= 0) continue;
          const old = Number(txt(s, "OldPrice")) || 0;
          const { stock, remote } = stockOf(s);
          const name = txt(s, "NAME") || txt(e, "NAME");
          const color = txt(s, "SimpleColor") || txt(s, "Color");
          const size = txt(s, "ClothesSize");
          const images = kidsOf(s, "Image")
            .map((i) => i.text.trim())
            .filter(Boolean)
            .map((p) => ({ superbig: SITE + p, big: SITE + p }));
          const pack = [txt(s, "PackagingType"), num(s, "PackagingQuantity") ? `${num(s, "PackagingQuantity")} шт.` : ""].filter(Boolean).join(", ");
          const attrs = [
            ...attrsBase,
            { name: "Размер", value: txt(s, "Size") },
            { name: "Страна производства", value: txt(s, "Country").toLowerCase().replace(/^./, (c) => c.toUpperCase()) },
            { name: "Виды нанесения", value: list(txt(s, "ApplicationID")).join(", ") },
            { name: "Места нанесения", value: list(txt(s, "ApplicationPlace")).join(", ") },
            { name: "Упаковка", value: pack },
          ].filter((a) => a.value && a.value !== "-");
          rows.push([
            pid(id), SUPPLIER, (txt(s, "FullArticle") || txt(e, "Article")).slice(0, 64),
            `h${model}-${txt(s, "ColorCode") || color || id}`.slice(0, 32), `hh${model}`,
            slugify(name).slice(0, 120), name.slice(0, 400), null, coverFrom(images),
            price, old > price ? old : null, 0, size && size !== "универсальный" ? size.slice(0, 64) : null,
            JSON.stringify(color ? [{ name: color }] : []), JSON.stringify([ours]), ours, null,
            stock, remote, 0, txt(s, "New") === "1" ? 1 : 0, started, started,
          ]);
          for (const c of linked) linkRows.push([pid(id), c]);
          details.push([pid(id), cleanDescription(txt(s, "Comment_full_html") || txt(s, "Comment")) || null, JSON.stringify(attrs), JSON.stringify(images)]);
          total++;
        }
      };

      // Разделы идут в начале документа, товары — после: товары копятся в очереди, пока не готово сопоставление разделов.
      const drain = async () => {
        if (!groups || !queue.length) return;
        const resolve = await groups;
        const batch = queue;
        queue = [];
        for (const e of batch) addItem(e, resolve);
        if (rows.length >= BATCH) await flush();
      };
      await streamItems(
        await open("all"),
        (name, level) => (name === "Catalog_groups" && level === 2) || (name === "Item" && level === 3),
        (e) => {
          if (e.name === "Catalog_groups") groups = categoryResolver(readGroups(e));
          else queue.push(e);
        },
        drain,
      );
      if (!groups) throw new Error("Happy Gifts: в выгрузке нет разделов");
      await drain();
      await flush();
      if (total < 3000) throw new Error(`Happy Gifts вернул подозрительно мало товаров: ${total}`);
      await exec("UPDATE oc_products SET deleted = 1, stock = 0, remote = 0 WHERE supplier = ? AND synced_at < ?", [SUPPLIER, started]);
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

/** Быстрая синхронизация: цены и остатки Happy Gifts (type=amount; поставщик просит не чаще 4 раз в день). */
export function syncHappyGifts(): Promise<{ items: number }> {
  return single("happygifts", async () => {
    const log = await logStart("happygifts");
    try {
      const stock: [string, number, number, number][] = [];
      await streamItems(
        await open("amount"),
        (name, level) => name === "SubItem" && level === 5,
        (s) => {
          const id = txt(s, "ID");
          if (id) stock.push([pid(id), priceOf(s), ...Object.values(stockOf(s))] as [string, number, number, number]);
        },
      );
      if (stock.length < 3000) throw new Error("Happy Gifts: неожиданный ответ по остаткам");
      const conn = await getPool().getConnection();
      try {
        await conn.query("CREATE TEMPORARY TABLE IF NOT EXISTS tmp_happygifts (id VARCHAR(32) PRIMARY KEY, price DECIMAL(12,2), stock INT, remote INT)");
        await conn.query("TRUNCATE tmp_happygifts");
        for (let i = 0; i < stock.length; i += 2000) await conn.query("INSERT IGNORE INTO tmp_happygifts VALUES ?", [stock.slice(i, i + 2000)]);
        await conn.query(
          `UPDATE oc_products p JOIN tmp_happygifts t ON t.id = p.id
           SET p.price = IF(t.price > 0, t.price, p.price), p.stock = t.stock, p.remote = t.remote
           WHERE p.supplier = 'happygifts'`,
        );
        await conn.query("DROP TEMPORARY TABLE IF EXISTS tmp_happygifts");
      } finally {
        conn.release();
      }
      await logEnd(log, stock.length);
      return { items: stock.length };
    } catch (e) {
      await logEnd(log, 0, (e as Error).message);
      throw e;
    }
  });
}
