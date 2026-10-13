// Нанесение логотипа на позицию корзины (как на старом сайте: «Добавить нанесение» на карточке товара).
// Стоимость нанесения не считается автоматически — её рассчитывает менеджер после оформления заявки.
import { applications } from "@/content/home";
import { PRINT_TAGS } from "@/lib/catalog/facets";

export type BrandingFile = { id: string; name: string; size: number; type: string };
/** estimate — предварительный расчёт из калькулятора (ориентир для менеджера). */
export type Branding = { method: string; comment?: string; files?: BrandingFile[]; estimate?: string };

export const BRANDING_MAX_FILES = 5;

/** Строка для заявки и письма: «Тампопечать (логотип 1 цвет, на корпусе), файлов: 2». */
export function brandingLine(b: Branding): string {
  const parts = [b.method];
  if (b.comment) parts.push(`(${b.comment})`);
  if (b.files?.length) parts.push(`файлов: ${b.files.length}`);
  if (b.estimate) parts.push(`[расчёт: ${b.estimate}]`);
  return parts.join(" ");
}

// Метка способа нанесения (фасет) → страница вида нанесения со сроком и тиражом.
const TAG_TO_APP: Record<string, string> = {
  tampo: "pad-press",
  trafaret: "silk-press",
  gravirovka: "laser-engraving",
  uf: "uv-press",
  vyshivka: "embroidery",
  tisnenie: "embrossing",
  transfer: "thermal-transfer",
  polnocvet: "digital-press",
  sublimaciya: "sublime-press",
  dekol: "decal",
  smola: "dome-stickers",
};

const nb = (s: string) => s.replace(/[ ⁠]/g, " ");

/** Срок, тираж и ссылка на описание для выбранного способа (если он нам известен). */
export function brandingInfo(method: string): { slug: string; title: string; term: string; run: string; minRun: number; href: string } | null {
  const text = method.toLowerCase().replace(/ё/g, "е");
  const tag = PRINT_TAGS.find((t) => t.re.test(text));
  const app = tag ? applications.items.find((a) => a.id === TAG_TO_APP[tag.id]) : undefined;
  if (!app) return null;
  const run = nb(app.run.replace("Тираж: ", ""));
  return { slug: app.id, title: app.title, term: nb(app.term.replace("Срок: ", "")), run, minRun: Number(run.replace(/\s/g, "").match(/^\d+/)?.[0] ?? 1), href: app.href };
}
