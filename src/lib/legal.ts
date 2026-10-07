import raw from "@/content/legal.json";

export type LegalBlock =
  | { type: "h2" | "h3" | "p"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "table"; rows: [string, string][] };

export type LegalDoc = { slug: string; title: string; blocks: LegalBlock[] };

const docs = raw as LegalDoc[];

export const getLegal = (slug: string): LegalDoc => {
  const d = docs.find((x) => x.slug === slug);
  if (!d) throw new Error(`Нет документа ${slug}`);
  return d;
};

/** Документы в подвале (короткие подписи). */
export const legalLinks = [
  { label: "Персональные данные", href: "/personal-data-processing" },
  { label: "Политика конфиденциальности", href: "/agreements" },
  { label: "Пользовательское соглашение", href: "/terms-of-use" },
  { label: "Возврат и претензии", href: "/claim-resolution-process" },
  { label: "Требования к макетам", href: "/printing-terms" },
  { label: "Реквизиты", href: "/about#requisites" },
];
