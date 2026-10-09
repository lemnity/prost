// Фильтры раздела: цвет, материал, вид нанесения — нормализованные метки из характеристик всех складов.
// Метки считаются при синхронизации (таблица oc_product_facets), в разделе показываются только встречающиеся.
import { COLOR_TAGS, deriveColors } from "./colors";

export type FacetKind = "c" | "m" | "p";
export type FacetTag = { id: string; label: string; re: RegExp };

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");

export const MATERIAL_TAGS: FacetTag[] = [
  { id: "metall", label: "Металл", re: /металл|сталь|стал[иь]|алюмини|латун|цинк|хром|медн/ },
  { id: "plastik", label: "Пластик", re: /пластик|абс|полипропилен|пвх|поликарбонат|акрил(?!ов)|полистирол|тритан|полиэтилен/ },
  { id: "derevo", label: "Дерево и бамбук", re: /дерев|бамбук|пробк|фанер|мдф/ },
  { id: "hlopok", label: "Хлопок и лён", re: /хлоп[ок]|льн[яо]|(?<![а-я])лен(?![а-я])/ },
  { id: "sintetika", label: "Полиэстер и синтетика", re: /полиэстер|нейлон|микрофибр|флис|спандекс|эластан|вискоз|полиамид/ },
  { id: "kozha", label: "Кожа и экокожа", re: /кож[аиеу]|экокож|полиуретан/ },
  { id: "steklo", label: "Стекло", re: /стекл/ },
  { id: "keramika", label: "Керамика и фарфор", re: /керамик|фарфор|фаянс/ },
  { id: "silikon", label: "Силикон и резина", re: /силикон|резин/ },
  { id: "bumaga", label: "Бумага и картон", re: /бумаг|картон|крафт/ },
  { id: "softtouch", label: "Софт-тач", re: /софт-тач|soft[- ]?touch/ },
  { id: "sherst", label: "Шерсть и трикотаж", re: /шерст|акрилов|трикотаж/ },
];

export const PRINT_TAGS: FacetTag[] = [
  { id: "tampo", label: "Тампопечать", re: /тампопечат/ },
  { id: "trafaret", label: "Трафаретная печать", re: /трафарет|шелкограф/ },
  { id: "gravirovka", label: "Гравировка", re: /гравир/ },
  { id: "uf", label: "УФ-печать", re: /уф[- ]|уф$|(?<![a-z])uv/ },
  { id: "vyshivka", label: "Вышивка", re: /вышивк/ },
  { id: "tisnenie", label: "Тиснение", re: /тиснен/ },
  { id: "transfer", label: "Термотрансфер и DTF", re: /термотрансфер|трансфер|dtf|флекс/ },
  { id: "polnocvet", label: "Полноцветная печать", re: /полноцвет|цифров(?:ая)? печат|dtg|текстильный принтер/ },
  { id: "sublimaciya", label: "Сублимация", re: /сублимац/ },
  { id: "dekol", label: "Деколь", re: /деколь/ },
  { id: "smola", label: "Заливка смолой", re: /смол|доминг/ },
];

export const FACETS: { kind: FacetKind; param: string; label: string; tags: { id: string; label: string; swatch?: string }[] }[] = [
  { kind: "c", param: "color", label: "Цвет", tags: COLOR_TAGS.map((c) => ({ id: c.id, label: c.label, swatch: c.swatch })) },
  { kind: "m", param: "material", label: "Материал", tags: MATERIAL_TAGS },
  { kind: "p", param: "print", label: "Вид нанесения", tags: PRINT_TAGS },
];

const match = (tags: FacetTag[], texts: string[]) => {
  const t = norm(texts.join(" | "));
  return t ? tags.filter((g) => g.re.test(t)).map((g) => g.id) : [];
};

/** Метки товара: цвета — из названий цветов, материал и нанесение — из характеристик. */
export function facetsOf(colors: string[], attrs: { name: string; value: string }[]): [FacetKind, string][] {
  const values = (re: RegExp) => attrs.filter((a) => re.test(a.name)).map((a) => String(a.value ?? ""));
  return [
    ...deriveColors(colors).map((id): [FacetKind, string] => ["c", id]),
    ...match(MATERIAL_TAGS, values(/^Материал/)).map((id): [FacetKind, string] => ["m", id]),
    ...match(PRINT_TAGS, values(/нанесени/i)).map((id): [FacetKind, string] => ["p", id]),
  ];
}
