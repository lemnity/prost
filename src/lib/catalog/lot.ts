import { formatPriceValue, pluralRu } from "@/lib/format";
import type { ProductLot } from "./types";

/** «1 цвет», «3 цвета», «8 цветов». */
export const colorsLabel = (n: number) => `${n} ${pluralRu(n, ["цвет", "цвета", "цветов"])}`;

/** Цены партии: «239–278 ₽» или «239 ₽». */
export const lotPrice = (l: ProductLot) =>
  l.min === l.max ? formatPriceValue(l.min) : `${formatPriceValue(l.min).replace(/ ₽$/, "")}–${formatPriceValue(l.max)}`;
