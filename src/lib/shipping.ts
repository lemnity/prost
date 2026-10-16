// Отслеживание доставки заявки: этап, транспортная компания, трек-номер. Правит администратор, клиент видит в своей заявке.

export const SHIP_STAGES = [
  { key: "prep", label: "Готовится" },
  { key: "production", label: "В производстве" },
  { key: "shipped", label: "Отправлен" },
  { key: "delivered", label: "Получен" },
] as const;
export type ShipStage = (typeof SHIP_STAGES)[number]["key"];

export const CARRIERS = [
  { key: "cdek", label: "СДЭК", track: (t: string) => `https://www.cdek.ru/ru/tracking/?order_id=${encodeURIComponent(t)}` },
  { key: "pochta", label: "Почта России", track: (t: string) => `https://www.pochta.ru/tracking?barcode=${encodeURIComponent(t)}` },
  { key: "dellin", label: "Деловые Линии" },
  { key: "pek", label: "ПЭК" },
  { key: "baikal", label: "Байкал Сервис" },
  { key: "courier", label: "Курьер ProStyle" },
  { key: "pickup", label: "Самовывоз" },
  { key: "other", label: "Другая" },
] as const satisfies readonly { key: string; label: string; track?: (t: string) => string }[];
export type CarrierKey = (typeof CARRIERS)[number]["key"];

export type Shipping = {
  stage: ShipStage;
  carrier?: CarrierKey;
  track?: string;
  /** ISO-дата последнего изменения. */
  updatedAt: string;
};

export const stageLabel = (s: ShipStage) => SHIP_STAGES.find((x) => x.key === s)?.label ?? s;
export const stageIndex = (s: ShipStage) => SHIP_STAGES.findIndex((x) => x.key === s);
export const carrierLabel = (c?: string) => CARRIERS.find((x) => x.key === c)?.label ?? "";

/** Ссылка на отслеживание у перевозчика — только там, где адрес известен; иначе клиент ищет по номеру на сайте ТК. */
export function trackUrl(s: Pick<Shipping, "carrier" | "track">): string | null {
  if (!s.track) return null;
  const c = CARRIERS.find((x) => x.key === s.carrier);
  return c && "track" in c ? c.track(s.track) : null;
}

/** Проверка данных из админки: неизвестные значения отбрасываем. */
export function parseShipping(v: unknown): Omit<Shipping, "updatedAt"> | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const stage = SHIP_STAGES.find((x) => x.key === o.stage)?.key;
  if (!stage) return null;
  const carrier = CARRIERS.find((x) => x.key === o.carrier)?.key;
  const track = typeof o.track === "string" ? o.track.trim().slice(0, 60) : "";
  return { stage, ...(carrier ? { carrier } : {}), ...(track ? { track } : {}) };
}
