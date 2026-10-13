import type { Block, Section } from "@/lib/application-types";

/**
 * Прайс нанесения — единый источник для таблиц «Прайс-лист» и калькулятора.
 * Цены в рублях; строки «whole» — цена за весь малый тираж (с трафаретом/клише).
 */

export type PriceRow = {
  label: string;
  prices: number[];
  /** Для рядов-тиражей: с какого количества действует ряд. */
  from?: number;
  whole?: boolean;
  /** Минимальная сумма заказа для этого ряда (формата). */
  minTotal?: number;
  /** С какого тиража заказ дороже минимальной суммы — только для таблицы. */
  rec?: number;
};

export type Addon = {
  label: string;
  /** Наценка в процентах к нанесению (может быть отрицательной). */
  pct?: number;
  /** Разовая доплата за заказ. */
  fixed?: number;
  /** Доплата за изделие — цена из колонки текущего ряда. */
  col?: number;
};

export type PriceVariant = {
  id: string;
  title: string;
  intro?: string;
  /** Заголовок первой колонки таблицы. */
  rowHead: string;
  /** Ряды — тиражи (выбираются по количеству) или форматы/поверхности (выбирает клиент). */
  byQty: boolean;
  rowLabel?: string;
  cols: string[];
  colLabel?: string;
  /** Какие колонки можно выбрать в калькуляторе (по умолчанию все). */
  choose?: number[];
  /** Подпись цен под таблицей колонок: добавляется к заголовкам. */
  unit?: string;
  rows: PriceRow[];
  minTotal?: number;
  /** Трафарет/клише за каждый цвет: число цветов — по номеру колонки. */
  setup?: { what: string; price: number };
  /** Клише по площади. */
  cliche?: { perCm2: number; min: number };
  /** Цена рассчитана для base см², сверх — доплата за см² по тиражу. */
  area?: { base: number; extra: { from: number; label: string; price: number }[] };
  addons?: Addon[];
  notes?: string[];
  extra?: Block[];
};

const RUB = ", руб./шт.";
const colors = (n: number) => ["1 цвет", "2 цвета", "3 цвета", "4 цвета"].slice(0, n);
const silkAddons = (change: number, extra: Addon[] = []): Addon[] => [
  { label: "Нанесение золотом или серебром", pct: 25 },
  { label: "Особый цвет по Pantone", pct: 25 },
  { label: "Смена цвета в тираже", fixed: change },
  ...extra,
];
const qtyRows = (list: [string, number, ...number[]][], whole?: string): PriceRow[] =>
  list.map(([label, from, ...prices], i) => ({ label, from, prices, ...(i === 0 && whole ? { whole: true } : {}) }));

export const PRINT_PRICES: Record<string, PriceVariant[]> = {
  "uv-press": [
    {
      id: "diaries",
      title: "На ежедневниках, блокнотах, плакетках",
      intro: "Цена за изделие не зависит от тиража и определяется форматом изображения.",
      rowHead: "Формат",
      byQty: false,
      rowLabel: "Формат",
      cols: ["CMYK + белый", "+ лак", "Только лак"],
      colLabel: "Печать",
      choose: [0, 2],
      unit: RUB,
      minTotal: 1300,
      rows: [
        { label: "A6", prices: [125, 18, 125] },
        { label: "A6+", prices: [185, 26, 185] },
        { label: "A5", prices: [248, 35, 248] },
        { label: "A5+", prices: [370, 52, 370] },
        { label: "A4", prices: [500, 69, 500] },
      ],
      addons: [{ label: "Добавить лак поверх печати", col: 1 }],
      notes: ["«+ лак» — доплата за лак поверх печати, «только лак» — лаковое покрытие без печати."],
    },
    {
      id: "cards",
      title: "На флешках-кредитных картах",
      rowHead: "Тираж",
      byQty: true,
      cols: ["CMYK + белый", "+ лак", "Только лак"],
      colLabel: "Печать",
      choose: [0, 2],
      unit: RUB,
      minTotal: 1300,
      rows: qtyRows([["1–9 шт.", 1, 340, 33, 65], ["10–49 шт.", 10, 127, 18, 39], ["50–99 шт.", 50, 117, 15, 30], ["100–199 шт.", 100, 105, 13, 25], ["от 200 шт.", 200, 115, 13, 25]]),
      addons: [{ label: "Добавить лак поверх печати", col: 1 }],
    },
    {
      id: "pens",
      title: "На ручках, брелоках, флешках, карандашах",
      rowHead: "Тираж",
      byQty: true,
      cols: ["CMYK + белый", "+ лак", "Только лак"],
      colLabel: "Печать",
      choose: [0, 2],
      unit: RUB,
      minTotal: 1300,
      rows: qtyRows([["1–9 шт.", 1, 299, 29, 57], ["10–49 шт.", 10, 76, 16, 34], ["50–99 шт.", 50, 57, 13, 26], ["от 100 шт.", 100, 37, 11, 22]]),
      addons: [{ label: "Добавить лак поверх печати", col: 1 }],
    },
  ],
  "uv-dtf": [
    {
      id: "uv-dtf",
      title: "Стоимость",
      intro: "Цена за изделие зависит только от формата. Для каждого формата есть минимальная стоимость заказа: если тираж меньше указанного в таблице, оплачивается минимальная сумма. Цены в рублях, тираж в штуках.",
      rowHead: "Формат",
      byQty: false,
      rowLabel: "Формат",
      cols: ["За 1 шт."],
      rows: [
        { label: "A9", prices: [60], minTotal: 1920, rec: 32 },
        { label: "A8", prices: [95], minTotal: 1520, rec: 16 },
        { label: "A7", prices: [160], minTotal: 1280, rec: 8 },
        { label: "A6", prices: [250], minTotal: 1000, rec: 4 },
        { label: "A5", prices: [400], minTotal: 800, rec: 2 },
      ],
    },
  ],
  dtf: [
    {
      id: "dtf",
      title: "Стоимость",
      intro: "Цена за изделие зависит только от формата и не меняется с тиражом. В колонке «Тираж от» указано, с какого количества заказ выходит дороже минимальной суммы. Цены в рублях, тираж в штуках.",
      rowHead: "Формат",
      byQty: false,
      rowLabel: "Формат",
      cols: ["За 1 шт."],
      minTotal: 1250,
      rows: [
        { label: "A6", prices: [96], rec: 14 },
        { label: "A5", prices: [120], rec: 12 },
        { label: "A4", prices: [225], rec: 6 },
        { label: "A3", prices: [440], rec: 3 },
        { label: "A2", prices: [820], rec: 2 },
      ],
    },
  ],
  "thermal-transfer": [
    {
      id: "full-color",
      title: "Полноцветный термотрансфер",
      intro: "Цена за нанесение одного изображения на изделие зависит от формата и цвета поверхности.",
      rowHead: "Поверхность",
      byQty: false,
      rowLabel: "Поверхность",
      cols: ["A6", "A5", "A4", "A3"],
      colLabel: "Формат",
      unit: RUB,
      rows: [
        { label: "Светлая", prices: [100, 145, 250, 720] },
        { label: "Тёмная", prices: [130, 220, 390, 720] },
      ],
    },
  ],
  "laser-engraving": [
    {
      id: "engraving",
      title: "Стоимость",
      intro: "Цена считается для площади нанесения до 10 см². Тираж до 10 шт. оплачивается целиком, для тиражей больше указана цена за 1 шт. в рублях.",
      rowHead: "Тираж",
      byQty: true,
      cols: ["Площадь до 10 см²"],
      rows: qtyRows([["до 10 шт., за весь тираж", 1, 1160], ["10–19 шт.", 10, 121], ["20–49 шт.", 20, 99], ["50–99 шт.", 50, 83], ["100–299 шт.", 100, 68], ["300–499 шт.", 300, 64], ["500–999 шт.", 500, 57], ["от 1000 шт.", 1000, 50]], "whole"),
      area: { base: 10, extra: [{ from: 1, label: "до 100 шт.", price: 2.84 }, { from: 100, label: "от 100 шт.", price: 1.9 }] },
      addons: [
        { label: "Круговая гравировка", pct: 20 },
        { label: "Ручки, флешки, брелоки с площадью до 4 см²", pct: -50 },
      ],
    },
  ],
  "sublime-press": [
    {
      id: "mugs",
      title: "Сублимация на кружках",
      intro: "Тираж до 12 шт. оплачивается целиком. Для тиражей больше указана цена за одну кружку в рублях.",
      rowHead: "Тираж",
      byQty: true,
      cols: ["Цена"],
      rows: qtyRows([["до 12 шт., за весь тираж", 1, 2000], ["13–36 шт.", 13, 170], ["37–108 шт.", 37, 140], ["109–180 шт.", 109, 120], ["181–324 шт.", 181, 110], ["325–504 шт.", 325, 100], ["от 505 шт.", 505, 95]], "whole"),
    },
    {
      id: "textile",
      title: "Сублимация на текстиле и других изделиях",
      intro: "Цена зависит от формата изображения. Тираж до 9 шт. оплачивается целиком, для тиражей больше указана цена за 1 шт. в рублях.",
      rowHead: "Тираж",
      byQty: true,
      cols: ["A6", "A5", "A4", "A3"],
      colLabel: "Формат",
      rows: qtyRows([["до 9 шт., за весь тираж", 1, 800, 1400, 2470, 3640], ["10–99 шт.", 10, 90, 135, 245, 360], ["100–299 шт.", 100, 85, 120, 230, 340], ["от 300 шт.", 300, 80, 105, 210, 310]], "whole"),
    },
  ],
  "silk-press": [
    {
      id: "goods",
      title: "На готовой продукции",
      intro: "Тираж до 10 шт. оплачивается целиком, с учётом изготовления трафарета. Для тиражей больше указана цена за 1 шт. в рублях.",
      rowHead: "Тираж",
      byQty: true,
      cols: colors(4),
      colLabel: "Цвета",
      rows: qtyRows([["до 10 шт., за весь тираж", 1, 2248, 3894, 5576, 7523], ["10–49 шт.", 10, 101, 142, 186, 257], ["50–99 шт.", 50, 94, 131, 170, 239], ["100–199 шт.", 100, 89, 121, 156, 222], ["200–299 шт.", 200, 82, 112, 147, 213], ["300–399 шт.", 300, 73, 101, 133, 195], ["400–499 шт.", 400, 66, 93, 121, 177], ["от 500 шт.", 500, 61, 82, 108, 160]], "whole"),
      setup: { what: "трафарета", price: 1240 },
      addons: silkAddons(354, [{ label: "Большая площадь заливки", pct: 25 }]),
    },
    {
      id: "bags",
      title: "На пакетах ПВД",
      intro: "Тираж до 100 шт. оплачивается целиком, с учётом изготовления трафарета. Для тиражей больше указана цена за 1 шт. в рублях.",
      rowHead: "Тираж",
      byQty: true,
      cols: colors(4),
      colLabel: "Цвета",
      rows: qtyRows([["до 100 шт., за весь тираж", 1, 3505, 6673, 9824, 13435], ["100–199 шт.", 100, 22.7, 42, 61.1, 84.8], ["200–299 шт.", 200, 21.8, 40.4, 58.6, 82], ["300–399 шт.", 300, 21.3, 38.8, 56.5, 79.5], ["400–499 шт.", 400, 20.8, 37.2, 56.3, 77], ["500–599 шт.", 500, 19.9, 36.2, 52.1, 74.6], ["600–699 шт.", 600, 19.2, 34.6, 49.8, 72.1], ["700–799 шт.", 700, 18.6, 33, 47.3, 69.4], ["800–899 шт.", 800, 17.7, 31.6, 45.2, 66.8], ["900–999 шт.", 900, 17.2, 30, 42.9, 64.3], ["от 1000 шт.", 1000, 17.1, 29.9, 42.8, 64.2]], "whole"),
      setup: { what: "трафарета", price: 1240 },
      addons: silkAddons(354),
      notes: ["Пакеты можем предоставить сами, цена пакета — в таблице ниже."],
      extra: [{ type: "table", head: ["Пакет ПВД, 70 мкм", "Белый" + RUB, "Цветной" + RUB], rows: [["40×50 см", "27", "29"], ["30×40 см", "23", "25"]] }],
    },
    {
      id: "paper",
      title: "На бумаге",
      intro: "Тираж до 10 шт. оплачивается целиком, с учётом изготовления трафарета. Для тиражей больше указана цена за 1 шт. в рублях.",
      rowHead: "Тираж",
      byQty: true,
      cols: colors(4),
      colLabel: "Цвета",
      rows: qtyRows([["до 10 шт., за весь тираж", 1, 1770, 3452, 5045, 6903], ["10–49 шт.", 10, 54, 98, 133, 195], ["50–99 шт.", 50, 48, 87, 117, 177], ["100–199 шт.", 100, 45, 80, 107, 160], ["200–299 шт.", 200, 39, 71, 96, 142], ["300–399 шт.", 300, 36, 62, 85, 124], ["400–499 шт.", 400, 30, 55, 75, 107], ["500–999 шт.", 500, 27, 46, 64, 89], ["от 1000 шт.", 1000, 23, 39, 54, 75]], "whole"),
      setup: { what: "трафарета", price: 1240 },
      addons: silkAddons(354),
      notes: ["Биговка — 7 ₽ за шт. при тираже до 50 шт., 4 ₽ за шт. при тираже больше 50 шт."],
    },
    {
      id: "caps",
      title: "На бейсболках",
      intro: "Тираж до 20 шт. оплачивается целиком, с учётом изготовления трафарета. Для тиражей больше указана цена за 1 шт. в рублях.",
      rowHead: "Тираж",
      byQty: true,
      cols: colors(2),
      colLabel: "Цвета",
      rows: qtyRows([["до 20 шт., за весь тираж", 1, 3500, 5700], ["20–49 шт.", 20, 85, 116], ["50–99 шт.", 50, 77, 108], ["100–199 шт.", 100, 73, 99], ["200–299 шт.", 200, 68, 92], ["300–399 шт.", 300, 60, 84], ["400–499 шт.", 400, 55, 76], ["от 500 шт.", 500, 50, 68]], "whole"),
      setup: { what: "трафарета", price: 1650 },
      addons: [{ label: "Нанесение золотом, серебром или по Pantone", pct: 25 }, { label: "Смена цвета в тираже", fixed: 550 }],
    },
  ],
  "pad-press": [
    {
      id: "pad",
      title: "Стоимость",
      intro: "Образец и тираж до 50 шт. оплачиваются целиком, с учётом изготовления клише. Для тиражей больше указана цена за 1 шт. в рублях.",
      rowHead: "Тираж",
      byQty: true,
      cols: colors(4),
      colLabel: "Цвета",
      rows: qtyRows([["образец или до 50 шт., за весь тираж", 1, 2629, 5036, 7665, 10505], ["50–99 шт.", 50, 17.2, 30, 47.1, 68.5], ["100–199 шт.", 100, 16.3, 28.7, 44.8, 65.5], ["200–299 шт.", 200, 15.6, 27.3, 42.5, 62], ["300–399 шт.", 300, 14.9, 25.9, 40.2, 58.6], ["400–499 шт.", 400, 14, 24.8, 37.8, 55.3], ["500–599 шт.", 500, 13.3, 23.2, 35.4, 52.1], ["600–699 шт.", 600, 12.4, 21.8, 33.3, 48.7], ["700–799 шт.", 700, 11.9, 20.6, 20.8, 45.4], ["800–899 шт.", 800, 11, 19.2, 28.5, 42.2], ["900–999 шт.", 900, 10.1, 17.7, 26.1, 38.8], ["1000–1999 шт.", 1000, 9.4, 16.3, 23.8, 35.4], ["от 2000 шт.", 2000, 8.5, 15.1, 21.5, 32.3]], "whole"),
      setup: { what: "клише", price: 1770 },
      addons: silkAddons(354, [{ label: "Печать на нестандартных изделиях", pct: 100 }]),
    },
  ],
  embrossing: [
    {
      id: "emboss",
      title: "Стоимость",
      intro: "Тираж до 25 шт. оплачивается целиком. Для тиражей больше указана цена за 1 шт. в рублях.",
      rowHead: "Тираж",
      byQty: true,
      cols: ["Бесцветное", "Фольгой"],
      colLabel: "Тиснение",
      rows: qtyRows([["до 25 шт., за весь тираж", 1, 1550, 2000], ["25–49 шт.", 25, 62, 80], ["50–99 шт.", 50, 58, 70], ["100–199 шт.", 100, 50, 64], ["200–299 шт.", 200, 45, 55], ["300–399 шт.", 300, 38, 48], ["400–499 шт.", 400, 35, 44], ["от 500 шт.", 500, 32, 39]], "whole"),
      cliche: { perCm2: 150, min: 1500 },
    },
  ],
  "spectrum-plates": [
    {
      id: "plates",
      title: "Стоимость",
      intro: "Цена шильда площадью до 15 см² зависит от тиража:",
      rowHead: "Тираж",
      byQty: true,
      cols: ["Шильд до 15 см²"],
      unit: RUB,
      rows: qtyRows([["1–9 шт.", 1, 151], ["10–49 шт.", 10, 125], ["50–99 шт.", 50, 105], ["100–249 шт.", 100, 95], ["250–499 шт.", 250, 92], ["от 500 шт.", 500, 84]]),
      area: { base: 15, extra: [{ from: 1, label: "до 10 шт.", price: 6.7 }, { from: 10, label: "10–100 шт.", price: 5.7 }, { from: 101, label: "от 100 шт.", price: 4.3 }] },
    },
  ],
};

export const hasPrintPrices = (slug: string) => slug in PRINT_PRICES;

const num = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
/** Число для таблицы: «1 240», «22,7». */
export const fmtNum = (n: number) => num.format(n);
const rub = (n: number) => `${fmtNum(n)} ₽`;
const pct = (p: number) => (p > 0 ? `+${p}%` : `${p}%`);

function variantBlocks(v: PriceVariant): Block[] {
  const blocks: Block[] = [];
  const intro = [v.minTotal ? `Минимальная стоимость за тираж — ${rub(v.minTotal)}.` : "", v.intro ?? ""].filter(Boolean).join(" ");
  if (intro) blocks.push({ type: "p", text: intro });
  const withMin = v.rows.some((r) => r.minTotal);
  const withRec = v.rows.some((r) => r.rec);
  const head = [v.rowHead, ...v.cols.map((c) => c + (v.unit ?? "")), ...(withMin ? ["Минимум"] : []), ...(withRec ? ["Тираж от"] : [])];
  blocks.push({
    type: "table",
    head,
    rows: v.rows.map((r) => [
      r.label,
      ...r.prices.map(fmtNum),
      ...(withMin ? [r.minTotal ? fmtNum(r.minTotal) : ""] : []),
      ...(withRec ? [r.rec ? fmtNum(r.rec) : ""] : []),
    ]),
  });
  if (v.area) {
    blocks.push({ type: "p", text: `Каждый см² сверх ${v.area.base} см² добавляет к цене изделия:` });
    blocks.push({ type: "table", head: ["Тираж", `За 1 см² сверх ${v.area.base} см², руб.`], rows: v.area.extra.map((e) => [e.label, fmtNum(e.price)]) });
  }
  const notes = [
    ...(v.setup ? [`Изготовление ${v.setup.what} — ${rub(v.setup.price)} за каждый цвет на партию.`] : []),
    ...(v.cliche ? [`Изготовление клише — ${rub(v.cliche.perCm2)} за 1 см², минимальная стоимость клише — ${rub(v.cliche.min)}.`] : []),
    ...(v.addons ?? []).filter((a) => a.pct || a.fixed).map((a) => `${a.label} — ${a.pct ? pct(a.pct) : rub(a.fixed!)}.`),
    ...(v.notes ?? []),
  ];
  if (notes.length) blocks.push({ type: "ul", items: notes });
  if (v.extra) blocks.push(...v.extra);
  return blocks;
}

/** Разделы вкладки «Прайс-лист» из прайса (null — прайса для вида нет). */
export function priceSections(slug: string): Section[] | null {
  const list = PRINT_PRICES[slug];
  return list ? list.map((v) => ({ tab: "prices", heading: v.title, blocks: variantBlocks(v) })) : null;
}

export type CalcInput = { row: number; col: number; qty: number; area: number; addons: number[] };
export type CalcResult = { total: number; perUnit: number; lines: string[]; minApplied: boolean };

const extraFor = (v: PriceVariant, qty: number) => [...(v.area?.extra ?? [])].reverse().find((e) => qty >= e.from)?.price ?? 0;

/** Ряд прайса для расчёта: по тиражу или выбранный клиентом. */
export function rowFor(v: PriceVariant, input: Pick<CalcInput, "row" | "qty">): PriceRow {
  if (!v.byQty) return v.rows[Math.min(input.row, v.rows.length - 1)];
  return [...v.rows].reverse().find((r) => input.qty >= (r.from ?? 1)) ?? v.rows[0];
}

/** Предварительная стоимость; окончательную подтверждает менеджер. */
export function calcPrice(v: PriceVariant, input: CalcInput): CalcResult {
  const qty = Math.max(1, Math.floor(input.qty) || 1);
  const r = rowFor(v, input);
  const col = Math.min(input.col, r.prices.length - 1);
  const addons = input.addons.map((i) => v.addons?.[i]).filter((a): a is Addon => !!a);
  const lines: string[] = [];

  // Нанесение без разовых расходов
  let print: number;
  let unit = 0;
  if (r.whole) {
    print = r.prices[col];
    lines.push(`Тираж ${r.label.replace(/, за весь тираж$/, "")}: ${rub(print)} за весь тираж`);
  } else {
    unit = r.prices[col] + addons.reduce((s, a) => s + (a.col != null ? r.prices[a.col] : 0), 0);
    print = unit * qty;
    lines.push(`${fmtNum(unit)}\u00a0₽ × ${fmtNum(qty)} шт. = ${rub(print)}`);
  }
  if (v.area && input.area > v.area.base) {
    const extra = Math.ceil(input.area - v.area.base) * extraFor(v, qty) * qty;
    print += extra;
    lines.push(`Площадь сверх ${v.area.base} см²: +${rub(Math.round(extra))}`);
  }
  const k = addons.reduce((s, a) => s + (a.pct ?? 0), 0);
  if (k) {
    lines.push(`Наценки ${pct(k)}: ${rub(Math.round((print * k) / 100))}`);
    print += (print * k) / 100;
  }

  let total = print;
  if (v.setup && !r.whole) {
    const s = v.setup.price * (col + 1);
    total += s;
    lines.push(`Изготовление ${v.setup.what}: ${rub(s)}`);
  }
  if (v.cliche) {
    const s = Math.max(v.cliche.min, Math.ceil(input.area) * v.cliche.perCm2);
    total += s;
    lines.push(`Клише: ${rub(s)}`);
  }
  for (const a of addons)
    if (a.fixed) {
      total += a.fixed;
      lines.push(`${a.label}: ${rub(a.fixed)}`);
    }

  const min = r.minTotal ?? v.minTotal ?? 0;
  const minApplied = total < min;
  if (minApplied) {
    total = min;
    lines.push(`Минимальная стоимость заказа: ${rub(min)}`);
  }
  total = Math.round(total);
  return { total, perUnit: Math.round((total / qty) * 100) / 100, lines, minApplied };
}

/** Площадь по умолчанию для полей калькулятора. */
export const defaultArea = (v: PriceVariant) => v.area?.base ?? (v.cliche ? 10 : 0);
