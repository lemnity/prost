// Нормализованные цвета товара из названия (и названий вариантов).
// Источник Oasis позже может отдавать цвет напрямую — формат тот же.

export type ColorTag = {
  id: string;
  label: string;
  /** CSS-фон для точки-образца. */
  swatch: string;
  /** Регулярное выражение по нормализованному тексту (нижний регистр, ё → е). */
  re: RegExp;
};

const L = "(?<![а-я])"; // начало слова (\b не работает с кириллицей)
const R = "(?![а-я])"; // конец слова
// Окончания прилагательных: черный/черная/черное/черные/черного/…
const ADJ = "(?:ый|ий|ой|ая|яя|ое|ее|ые|ие|ого|его|ую|юю|ым|им|ых|их)";
const stem = (s: string) => new RegExp(`${L}${s}[а-я]*`);
const adj = (s: string) => new RegExp(`${L}${s}${ADJ}${R}`);

// Порядок важен: «темно-синий» проверяется и вырезается раньше «синего».
export const COLOR_TAGS: ColorTag[] = [
  { id: "temno-siniy", label: "темно-синий", swatch: "#1F2F6B", re: /(?<![а-я])(?:темно|т\.)\s?-\s?син[а-я]*/ },
  { id: "chernyy", label: "черный", swatch: "#1A1A1A", re: stem("черн") },
  { id: "belyy", label: "белый", swatch: "#FFFFFF", re: adj("бел") },
  { id: "seryy", label: "серый", swatch: "#8E9093", re: adj("сер") },
  { id: "serebristyy", label: "серебристый", swatch: "linear-gradient(135deg,#E8E8E8,#A8A8A8)", re: stem("серебр") },
  { id: "zolotistyy", label: "золотистый", swatch: "linear-gradient(135deg,#F3D57A,#B8902E)", re: new RegExp(`${L}(?:золотист[а-я]*|золот(?:ой|ая|ое|ые|о)${R})`) },
  { id: "krasnyy", label: "красный", swatch: "#D7262B", re: stem("красн") },
  { id: "bordovyy", label: "бордовый", swatch: "#7A1F2B", re: stem("бордов") },
  { id: "rozovyy", label: "розовый", swatch: "#F28DB2", re: stem("розов") },
  { id: "oranzhevyy", label: "оранжевый", swatch: "#F28C28", re: stem("оранжев") },
  { id: "zheltyy", label: "желтый", swatch: "#F5D02A", re: stem("желт") },
  { id: "zelenyy", label: "зеленый", swatch: "#2E9B4F", re: stem("зелен") },
  { id: "salatovyy", label: "салатовый", swatch: "#9BD443", re: stem("салатов") },
  { id: "biryuzovyy", label: "бирюзовый", swatch: "#2BB5B0", re: stem("бирюзов") },
  { id: "goluboy", label: "голубой", swatch: "#7CC4F0", re: stem("голуб") },
  { id: "siniy", label: "синий", swatch: "#2457C5", re: new RegExp(`${L}син(?:ий|яя|ее|ие|его|ей|юю|им|их)${R}`) },
  { id: "fioletovyy", label: "фиолетовый", swatch: "#7B4BC4", re: stem("фиолетов") },
  { id: "korichnevyy", label: "коричневый", swatch: "#7B4A2A", re: stem("коричнев") },
  { id: "bezhevyy", label: "бежевый", swatch: "#E3CDA8", re: stem("бежев") },
  { id: "prozrachnyy", label: "прозрачный", swatch: "repeating-conic-gradient(#E6E6E6 0 25%,#FFFFFF 0 50%) 0 0/8px 8px", re: stem("прозрачн") },
  { id: "naturalnyy", label: "натуральный / древесный", swatch: "#C9A26B", re: new RegExp(`${L}(?:натуральн|древесн)[а-я]*`) },
  { id: "haki", label: "хаки", swatch: "#7D7A4F", re: new RegExp(`${L}хаки${R}`) },
];

const byId = new Map(COLOR_TAGS.map((c) => [c.id, c]));
export const colorTag = (id: string) => byId.get(id);

/** Цвета, упомянутые в текстах, в порядке словаря. */
export function deriveColors(texts: string[]): string[] {
  let text = texts.join(" | ").toLowerCase().replace(/ё/g, "е");
  const out: string[] = [];
  for (const c of COLOR_TAGS) {
    if (c.re.test(text)) {
      out.push(c.id);
      if (c.id === "temno-siniy") text = text.replace(new RegExp(c.re.source, "g"), " ");
    }
  }
  return out;
}
