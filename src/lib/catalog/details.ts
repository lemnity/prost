// Описание и характеристики товаров (выгрузка карточек prostyle.gifts).
// Только для сервера: страницы товаров и вычисление полей фильтров при сборке.
// В клиентский бандл и RSC листингов не попадает.
import raw from "@/data/catalog-details.json";

export type ProductSpecs = {
  supplier?: string;
  size?: string | null;
  weight?: string | null;
  material?: string | null;
  sku?: string | null;
  volume?: string | null;
  density?: string | null;
  packSize?: string | null;
  extra?: Record<string, string>;
};

export type ProductDetails = {
  specs: ProductSpecs;
  description: string;
  attributes: Record<string, string>;
};

const data = raw as unknown as Record<string, ProductDetails>;

export function getProductDetails(url: string): ProductDetails | null {
  return data[url] ?? null;
}

const clean = (v: string | null | undefined) => (v ?? "").replace(/\s+/g, " ").trim();

/** Материалы для фильтра: нижний регистр, без долей «50%», разделитель «;». */
export function normalizeMaterials(details: ProductDetails | null): string[] {
  const src = clean(details?.specs.material) || clean(details?.attributes["Материал товара"]);
  if (!src) return [];
  const lower = src.toLowerCase();
  if (lower === "несколько материалов") return [lower];
  const out = lower
    .split(";")
    .map((s) => s.replace(/\d+([.,]\d+)?\s*%/g, "").replace(/\s+/g, " ").replace(/[.\s]+$/, "").trim())
    .filter(Boolean);
  return [...new Set(out)];
}

export type SpecRow = { label: string; value: string };

const withUnit = (v: string, unit: string, test: RegExp) => (test.test(v) ? v : `${v} ${unit}`);

/** Строки характеристик для карточки товара (пустые опущены, дубли убраны). */
export function buildSpecRows(
  details: ProductDetails | null,
  product: { sku: string; brand: string },
): SpecRow[] {
  const s = details?.specs ?? {};
  const a = details?.attributes ?? {};
  const extra = s.extra ?? {};
  const used = new Set<string>();
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = clean(a[k]);
      used.add(k);
      if (v) return v;
    }
    return "";
  };

  const size = clean(s.size) || pick("Размер товара");
  const weight = clean(s.weight);
  const rows: SpecRow[] = [
    { label: "Артикул", value: clean(product.sku) || clean(s.sku) },
    { label: "Поставщик", value: clean(s.supplier) },
    { label: "Бренд", value: clean(product.brand) || clean(extra["Бренд"]) || pick("Бренд") },
    { label: "Материал", value: clean(s.material) || pick("Материал товара") },
    {
      label: "Размеры",
      // « см» — только к чисто числовым размерам без единиц.
      value: size && /^[\d.,\sxх×*d-]+$/i.test(size) ? withUnit(size, "см", /см/) : size,
    },
    {
      label: "Вес",
      value: weight && Number(weight.replace(",", ".")) > 0 ? withUnit(weight, "г", /[a-zа-я]/i) : pick("Вес"),
    },
    { label: "Объём", value: clean(s.volume) || pick("Объем", "Объём") },
    { label: "Плотность", value: clean(s.density) || pick("Плотность") },
    { label: "Цвет", value: pick("Цвет товара", "Цвета товара", "Цвет") },
    { label: "Цвет нанесения", value: pick("Цвет гравировки") },
    { label: "Производство", value: pick("Производство") },
    { label: "Штрихкод", value: pick("Штрихкод") },
    { label: "Размер упаковки", value: clean(s.packSize) || clean(extra["Размеры упаковки (см.)"]) },
  ];
  // Помечаем дубликаты основных полей среди атрибутов.
  ["Материал товара", "Цвет товара", "Цвета товара", "Цвет", "Бренд", "Размер товара", "Вес", "Объем", "Плотность"].forEach(
    (k) => used.add(k),
  );
  const seen = new Set(rows.filter((r) => r.value).map((r) => `${r.label}|${r.value}`.toLowerCase()));
  const values = new Set(rows.map((r) => r.value.toLowerCase()).filter(Boolean));
  const push = (label: string, value: string) => {
    const v = clean(value);
    const key = `${label}|${v}`.toLowerCase();
    if (!v || seen.has(key) || values.has(v.toLowerCase())) return;
    seen.add(key);
    rows.push({ label: label.replace(/[:\s]+$/, ""), value: v });
  };
  for (const [k, v] of Object.entries(a)) if (!used.has(k)) push(k, v);
  for (const [k, v] of Object.entries(extra)) {
    if (k !== "Бренд" && k !== "Размеры упаковки (см.)") push(k, v);
  }
  return rows.filter((r) => r.value);
}
