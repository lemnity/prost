import sax from "sax";
import { rebuildFacets } from "./facets";
import { exec, getPool, query, type Row } from "./db";
import { GIFTS_MAP } from "./gifts-map";
import { logEnd, logStart, recountCategories, ROOTS, single } from "./oasis";
import { slugify } from "@/lib/translit";

/**
 * Склад gifts.ru (Проект 111 / Happy Gifts): XML-выгрузка api2.gifts.ru/export/v2, доступ — GIFTS_LOGIN/GIFTS_PASSWORD
 * в /opt/prostyle/.env и IP сервера в белом списке личного кабинета gifts.ru. Не больше 5 запросов в секунду.
 *  — полная синхронизация (раз в сутки): tree.xml + filters.xml + product.xml (≈100 МБ, разбираем потоком) → oc_products;
 *  — быстрая (раз в час): stock.xml → цены и остатки.
 * Товары попадают в единое дерево через category_map (раздел gifts.ru → наш раздел), по умолчанию — GIFTS_MAP.
 * Id товара — «g<product_id>»; цвет — group_id, модель (все цвета) — color_group_id «gg<group>».
 */
const API = "https://api2.gifts.ru/export/v2/catalogue";
/** Фото отдаются публично с файлового сервера gifts.ru — хранить у себя не нужно. */
const FILES = "https://files.gifts.ru/reviewer/";
const COLOR_FILTER = "21";
const BATCH = 300;

const pid = (id: string) => `g${id}`;

function authHeader() {
  const login = process.env.GIFTS_LOGIN, password = process.env.GIFTS_PASSWORD;
  if (!login || !password) throw new Error("GIFTS_LOGIN / GIFTS_PASSWORD не заданы");
  return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
}

async function open(file: string): Promise<Response> {
  // Для отладки: GIFTS_DIR — папка с заранее скачанными файлами выгрузки.
  if (process.env.GIFTS_DIR) {
    const { createReadStream } = await import("node:fs");
    const { Readable } = await import("node:stream");
    return new Response(Readable.toWeb(createReadStream(`${process.env.GIFTS_DIR}/${file}`)) as ReadableStream);
  }
  const res = await fetch(`${API}/${file}`, { headers: { Authorization: authHeader() }, signal: AbortSignal.timeout(900_000), cache: "no-store" });
  if (res.status === 401) throw new Error("gifts.ru: неверный логин/пароль или IP сервера не в белом списке");
  if (!res.ok || !res.body) throw new Error(`gifts.ru ${file}: ответ ${res.status}`);
  return res;
}

/** Мини-DOM узла XML. */
type El = { name: string; attrs: Record<string, string>; text: string; kids: El[] };
const kid = (e: El | undefined, name: string) => e?.kids.find((k) => k.name === name);
const kidsOf = (e: El | undefined, name: string) => e?.kids.filter((k) => k.name === name) ?? [];
const txt = (e: El | undefined, name: string) => kid(e, name)?.text.trim() ?? "";

/**
 * Потоковый разбор: каждый элемент `item` на глубине `depth` (корень — 1) собирается в мини-DOM и передаётся в onItem.
 * Остальной документ в памяти не держим — product.xml весит ~100 МБ, а памяти у сервера мало.
 */
async function streamItems(file: string, item: string, depth: number, onItem: (e: El) => void, afterChunk?: () => Promise<void>) {
  const res = await open(file);
  const parser = sax.parser(true, { trim: false, normalize: false });
  const stack: string[] = [];
  let cur: El[] = [];
  let error: Error | null = null;
  parser.onerror = (e) => {
    error = e;
  };
  parser.onopentag = (t) => {
    stack.push(t.name);
    const el: El = { name: t.name, attrs: t.attributes as Record<string, string>, text: "", kids: [] };
    if (cur.length) {
      cur[cur.length - 1].kids.push(el);
      cur.push(el);
    } else if (t.name === item && stack.length === depth + 1) cur = [el];
  };
  parser.ontext = parser.oncdata = (t) => {
    if (cur.length) cur[cur.length - 1].text += t;
  };
  parser.onclosetag = () => {
    stack.pop();
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

type StockRow = { free: number; inway: number; price: number };

async function loadStock(): Promise<Map<string, StockRow>> {
  const map = new Map<string, StockRow>();
  await streamItems("stock.xml", "stock", 1, (e) => {
    const id = txt(e, "product_id");
    if (id) map.set(id, { free: Math.max(0, Number(txt(e, "free")) || 0), inway: Math.max(0, Number(txt(e, "inwayfree")) || 0), price: Number(txt(e, "enduserprice")) || 0 });
  });
  return map;
}

/** Разделы gifts.ru (tree.xml): id → название с родителем; товар → разделы. */
async function loadTree() {
  const pages = new Map<string, { name: string; parent: string | null }>();
  const links = new Map<string, Set<string>>();
  const res = await open("tree.xml");
  const parser = sax.parser(true);
  const path: string[] = []; // id страниц от корня до текущей
  const tags: string[] = [];
  let buf = "", linkPage = "", linkProduct = "";
  // <page> — раздел (вложенные разделы), внутри него <product><page>раздел</page><product>товар</product></product> — привязка.
  parser.onopentag = (t) => {
    if (t.name === "page" && tags[tags.length - 1] !== "product") path.push("");
    tags.push(t.name);
    buf = "";
  };
  parser.ontext = (t) => {
    buf += t;
  };
  parser.onclosetag = (name) => {
    tags.pop();
    const parent = tags[tags.length - 1];
    const value = buf.trim();
    buf = "";
    if (parent === "product") {
      if (name === "page") linkPage = value;
      else if (name === "product") linkProduct = value;
    } else if (name === "page_id" && parent === "page") {
      path[path.length - 1] = value;
      pages.set(value, { name: "", parent: path.length > 1 ? path[path.length - 2] : null });
    } else if (name === "name" && parent === "page") {
      const p = pages.get(path[path.length - 1]);
      if (p) p.name = value;
    } else if (name === "product") {
      if (linkPage && linkProduct) {
        const set = links.get(linkProduct) ?? new Set<string>();
        set.add(linkPage);
        links.set(linkProduct, set);
      }
      linkPage = linkProduct = "";
    } else if (name === "page") path.pop();
  };
  const decoder = new TextDecoder();
  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) parser.write(decoder.decode(chunk, { stream: true }));
  parser.close();
  return { pages, links };
}

async function loadColors(): Promise<Map<string, string>> {
  const colors = new Map<string, string>();
  await streamItems("filters.xml", "filtertype", 2, (e) => {
    if (txt(e, "filtertypeid") !== COLOR_FILTER) return;
    for (const f of kidsOf(kid(e, "filters"), "filter")) colors.set(txt(f, "filterid"), txt(f, "filtername"));
  });
  return colors;
}

/** Сопоставление разделов: заводим новые разделы gifts.ru в category_map, ручной выбор из админки не трогаем. */
async function syncCategoryMap(pages: Map<string, { name: string; parent: string | null }>): Promise<Map<string, number | null>> {
  const label = (id: string) => {
    const p = pages.get(id)!;
    const parent = p.parent ? pages.get(p.parent) : undefined;
    return parent && parent.parent ? `${parent.name} / ${p.name}` : p.name;
  };
  const leaves = [...pages.keys()].filter((id) => pages.get(id)!.parent); // без корня «Каталог»
  const rows = leaves.map((id) => {
    const def = GIFTS_MAP[Number(id)];
    return ["gifts", id, label(id).slice(0, 255), def ?? null, def === undefined ? 0 : 1];
  });
  if (rows.length) {
    await exec(
      `INSERT INTO category_map (supplier, supplier_cat, supplier_name, category_id, auto) VALUES ?
       ON DUPLICATE KEY UPDATE supplier_name = VALUES(supplier_name), category_id = IF(auto = 1, VALUES(category_id), category_id)`,
      [rows],
    );
  }
  const saved = await query<Row & { supplier_cat: string; category_id: number | null }>("SELECT supplier_cat, category_id FROM category_map WHERE supplier = 'gifts'");
  return new Map(saved.map((r) => [r.supplier_cat, r.category_id]));
}

/** Описание без таблицы размеров и ссылок на сайт поставщика; списки — строками. */
function cleanDescription(html: string): string {
  return html
    .replace(/<div id="tablemer"[\s\S]*$/i, "")
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/<li[^>]*>/gi, "<br>• ")
    .replace(/<\/(li|ul)>/gi, "")
    .replace(/<ul[^>]*>/gi, "<br>")
    .replace(/<(?!br\b)[^>]+>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .replace(/^(\s*<br\s*\/?>)+|(<br\s*\/?>\s*)+$/gi, "")
    .trim();
}

type CatInfo = { id: number; parent_id: number | null; root: number | null; level: number };

/** Полная синхронизация каталога gifts.ru. */
export function syncGiftsCatalog(): Promise<{ items: number }> {
  return single("gifts-catalog", async () => {
    const log = await logStart("gifts-catalog");
    try {
      const { pages, links } = await loadTree();
      const map = await syncCategoryMap(pages);
      const colors = await loadColors();
      const stock = await loadStock();

      const cats = await query<Row & CatInfo>("SELECT id, parent_id, root, level FROM oc_categories");
      const byId = new Map(cats.map((c) => [c.id, c]));
      const ancestors = (id: number) => {
        const out: number[] = [];
        for (let c = byId.get(id); c; c = c.parent_id ? byId.get(c.parent_id) : undefined) out.push(c.id);
        return out;
      };
      const primaryOf = (ids: number[]) => {
        const known = ids.map((id) => byId.get(id)).filter((c): c is Row & CatInfo => !!c);
        for (const root of [ROOTS.products, ROOTS.holidays, ROOTS.vip]) {
          const own = known.filter((c) => (c.root ?? c.id) === root).sort((a, b) => b.level - a.level);
          if (own[0]) return own[0].id;
        }
        return known[0]?.id ?? null;
      };

      const started = new Date(Math.floor(Date.now() / 1000) * 1000);
      let rows: unknown[][] = [];
      let linkRows: [string, number][] = [];
      let total = 0;

      const flush = async () => {
        if (!rows.length) return;
        const batch = rows, batchLinks = linkRows;
        rows = [];
        linkRows = [];
        await exec(
          `INSERT INTO oc_products (id, supplier, article, group_id, color_group_id, slug, name, full_name, description, price, old_price, rating, size,
             colors, attributes, images, categories, primary_cat, brand_id, stock, remote, deleted, is_new, updated_at, synced_at) VALUES ?
           ON DUPLICATE KEY UPDATE supplier = VALUES(supplier), article = VALUES(article), group_id = VALUES(group_id), color_group_id = VALUES(color_group_id),
             slug = VALUES(slug), name = VALUES(name), full_name = VALUES(full_name), description = VALUES(description), price = VALUES(price),
             old_price = VALUES(old_price), size = VALUES(size), colors = VALUES(colors), attributes = VALUES(attributes), images = VALUES(images),
             categories = VALUES(categories), primary_cat = VALUES(primary_cat), stock = VALUES(stock), remote = VALUES(remote), deleted = 0,
             is_new = VALUES(is_new), updated_at = VALUES(updated_at), synced_at = VALUES(synced_at)`,
          [batch],
        );
        await exec("DELETE FROM oc_product_categories WHERE product_id IN (?)", [batch.map((r) => r[0])]);
        if (batchLinks.length) await exec("INSERT IGNORE INTO oc_product_categories (product_id, category_id) VALUES ?", [batchLinks]);
      };

      await streamItems(
        "product.xml",
        "product",
        1,
        (p) => {
          const id = txt(p, "product_id");
          const ours = [...(links.get(id) ?? [])].map((page) => map.get(page)).filter((c): c is number => typeof c === "number" && byId.has(c));
          if (!id || !ours.length) return; // раздел не выводим (null в сопоставлении) или товара нет в дереве
          const name = txt(p, "name");
          const group = txt(p, "group");
          const images = kidsOf(p, "product_attachment")
            .filter((a) => txt(a, "meaning") === "1" && txt(a, "image"))
            .map((a) => ({ superbig: FILES + txt(a, "image"), big: FILES + txt(a, "image") }));
          const cover = kid(p, "super_big_image")?.attrs.src;
          if (!images.length && cover) images.push({ superbig: FILES + cover, big: FILES + cover });
          const colorNames = [...new Set(kidsOf(kid(p, "filters"), "filter").filter((f) => txt(f, "filtertypeid") === COLOR_FILTER).map((f) => colors.get(txt(f, "filterid"))).filter(Boolean))];
          const prints = [...new Set(kidsOf(p, "print").map((x) => txt(x, "description")).filter(Boolean))];
          const alerts = kidsOf(kid(p, "alerts"), "alert").map((a) => a.text.trim()).filter(Boolean);
          const weight = Number(txt(p, "weight")) || 0;
          const attrs = [
            { name: "Материал", value: txt(p, "matherial") },
            { name: "Размер", value: txt(p, "product_size") },
            ...(weight ? [{ name: "Вес", value: String(weight), dim: "г" }] : []),
            { name: "Страна производства", value: txt(p, "sourcecountry") },
            { name: "Виды нанесения", value: prints.join(", ") },
            ...(txt(p, "ondemand") === "true" ? [{ name: "Под заказ", value: [txt(p, "moq") && `от ${txt(p, "moq")} шт.`, txt(p, "days") && `${txt(p, "days")} дн.`].filter(Boolean).join(", ") || "да" }] : []),
            ...alerts.map((a) => ({ name: "Важно", value: a })),
          ].filter((a) => a.value);
          const linked = [...new Set(ours.flatMap(ancestors))];
          const primary = primaryOf(ours);
          const base = {
            group: pid(id),
            model: group ? `gg${group}` : null,
            slug: slugify(txt(p, "groupname") || name).slice(0, 120),
            description: cleanDescription(txt(p, "content")) || null,
            colors: JSON.stringify(colorNames.map((n) => ({ name: n }))),
            attrs: JSON.stringify(attrs),
            images: JSON.stringify(images),
            cats: JSON.stringify(ours),
            isNew: kid(p, "status")?.attrs.id === "0" ? 1 : 0,
            mainPrice: Number(txt(kid(p, "price"), "price")) || 0,
          };
          const row = (rid: string, article: string, size: string | null, fallbackPrice: number) => {
            const s = stock.get(rid);
            const price = s?.price || fallbackPrice || base.mainPrice;
            return [
              pid(rid), "gifts", article.slice(0, 64), base.group, base.model, base.slug, name.slice(0, 400), null, base.description,
              price, null, 0, size ? size.slice(0, 64) : null, base.colors, base.attrs, base.images, base.cats, primary, null,
              s?.free ?? 0, s?.inway ?? 0, 0, base.isNew, started, started,
            ];
          };
          const sizes = kidsOf(p, "product").filter((s) => txt(s, "product_id"));
          const made = sizes.length
            ? sizes.map((s) => row(txt(s, "product_id"), txt(s, "code"), txt(s, "size_code") || null, Number(txt(kid(s, "price"), "price")) || 0))
            : [row(id, txt(p, "code"), null, base.mainPrice)];
          const priced = made.filter((r) => Number(r[9]) > 0);
          rows.push(...priced);
          for (const r of priced) for (const c of linked) linkRows.push([r[0] as string, c]);
          total += priced.length;
        },
        async () => {
          if (rows.length >= BATCH) await flush();
        },
      );
      await flush();
      if (total < 1000) throw new Error(`gifts.ru вернул подозрительно мало товаров: ${total}`);
      await exec("UPDATE oc_products SET deleted = 1, stock = 0, remote = 0 WHERE supplier = 'gifts' AND synced_at < ?", [started]);
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

/** Быстрая синхронизация: цены и остатки gifts.ru (stock.xml обновляется у поставщика раз в час). */
export function syncGifts(): Promise<{ items: number }> {
  return single("gifts", async () => {
    const log = await logStart("gifts");
    try {
      const stock = await loadStock();
      if (stock.size < 1000) throw new Error("gifts.ru: неожиданный ответ по остаткам");
      const conn = await getPool().getConnection();
      try {
        await conn.query("CREATE TEMPORARY TABLE IF NOT EXISTS tmp_gifts (id VARCHAR(32) PRIMARY KEY, price DECIMAL(12,2), stock INT, remote INT)");
        await conn.query("TRUNCATE tmp_gifts");
        const rows = [...stock].map(([id, s]) => [pid(id), s.price, s.free, s.inway]);
        for (let i = 0; i < rows.length; i += 2000) await conn.query("INSERT IGNORE INTO tmp_gifts VALUES ?", [rows.slice(i, i + 2000)]);
        await conn.query(
          `UPDATE oc_products p JOIN tmp_gifts t ON t.id = p.id
           SET p.price = IF(t.price > 0, t.price, p.price), p.stock = t.stock, p.remote = t.remote`,
        );
        await conn.query("DROP TEMPORARY TABLE IF EXISTS tmp_gifts");
      } finally {
        conn.release();
      }
      await logEnd(log, stock.size);
      return { items: stock.size };
    } catch (e) {
      await logEnd(log, 0, (e as Error).message);
      throw e;
    }
  });
}
