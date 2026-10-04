const rules = new Intl.PluralRules("ru");
const FORMS = {
  d: { one: "день", few: "дня", many: "дней", other: "дня" },
  h: { one: "час", few: "часа", many: "часов", other: "часа" },
  m: { one: "минута", few: "минуты", many: "минут", other: "минуты" },
  s: { one: "секунда", few: "секунды", many: "секунд", other: "секунды" },
} satisfies Record<string, Record<string, string>>;

export function plural(unit: keyof typeof FORMS, n: number): string {
  const forms: Record<string, string> = FORMS[unit];
  return forms[rules.select(n)] ?? forms.other;
}
