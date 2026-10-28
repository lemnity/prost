"use client";

import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import { ArrowRight, X } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { asset } from "@/lib/asset";
import { formatQty } from "@/lib/format";
import { colorsLabel, lotPrice } from "@/lib/catalog/lot";
import type { Product, ProductLot, ProductSwatch } from "@/lib/catalog/types";

const stockText = (s: ProductSwatch) => (s.stock > 0 ? `${formatQty(s.stock)} шт.` : "под заказ");

/**
 * Выбор цвета в витрине: клик выбирает (фото, название, артикул, остаток и корзина — этого цвета),
 * наведение только показывает фото. Без цветов возвращает товар как есть.
 */
export function useSwatches(product: Product) {
  const swatches = product.swatches;
  const [sel, setSel] = useState(() => Math.max(0, swatches?.findIndex((s) => s.id === product.id) ?? 0));
  const [hover, setHover] = useState<number | null>(null);
  const pick = swatches?.[sel];
  const current: Product = pick
    ? { ...product, id: pick.id, title: pick.title, sku: pick.sku, priceFrom: pick.priceFrom, oldPrice: pick.oldPrice, image: pick.image, url: pick.url, stock: pick.stock, preorder: pick.preorder }
    : product;
  const image = swatches?.[hover ?? sel]?.image ?? product.image;
  const total = swatches?.reduce((n, s) => n + s.stock, 0) ?? product.stock;
  return { swatches, sel, setSel, setHover, current, image, total };
}

type Pick = { swatches: ProductSwatch[]; sel: number; onPick: (i: number) => void; onHover: (i: number | null) => void };

/** Стрелки переходят между цветами группы. */
function arrows(e: KeyboardEvent<HTMLElement>) {
  if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
  const all = [...e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]")];
  const i = all.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  all[(i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : all.length - 1)) % all.length].focus();
}

function Thumb({ s, i, sel, onPick, onHover, size, tip = true }: { s: ProductSwatch; i: number; size: string; tip?: boolean } & Omit<Pick, "swatches">) {
  const checked = i === sel;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={`Цвет: ${s.color}, ${stockText(s)}`}
      tabIndex={checked ? 0 : -1}
      onClick={() => onPick(i)}
      onMouseEnter={() => onHover(i)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(i)}
      onBlur={() => onHover(null)}
      className={`group/th relative grid shrink-0 place-items-center rounded-[8px] border bg-white ${size} ${
        checked ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-[#e6e6e6] hover:border-[#b9b9b9]"
      }`}
    >
      <span className={`relative size-[74%] overflow-hidden rounded-[4px] ${s.stock > 0 ? "" : "opacity-40"}`}>
        {s.image ? (
          <ProductImage src={asset(s.image)} alt="" sizes="40px" fallback="mini" className="object-contain" />
        ) : (
          <span className="absolute inset-[12%] rounded-full ring-1 ring-black/15" style={{ background: s.swatch }} />
        )}
      </span>
      {/* Нет на складе — косая черта поверх миниатюры. */}
      {s.stock > 0 ? null : <span aria-hidden="true" className="absolute inset-x-[15%] top-1/2 h-[1.5px] -rotate-[40deg] bg-[#9a9a9a]" />}
      {tip ? (
        <span aria-hidden="true" className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] text-white group-hover/th:block">
          <b className="font-semibold">{s.color}</b> · {stockText(s)}
        </span>
      ) : null}
    </button>
  );
}

/** Столбик цветов слева поверх фото; «+N» открывает все цвета с остатками. Выбранный цвет всегда в столбике. */
export function ColorRail({ swatches, sel, onPick, onHover, max = 4, compact = false }: Pick & { max?: number; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const shown = swatches.length > max + 1 ? [...Array(max).keys()] : [...swatches.keys()];
  if (!shown.includes(sel)) shown[shown.length - 1] = sel;
  const rest = swatches.length - shown.length;
  const size = compact ? "size-7" : "size-7 sm:size-[38px]";
  return (
    <>
      <div role="radiogroup" aria-label={`Цвета, ${colorsLabel(swatches.length)}`} onKeyDown={arrows} className={`absolute left-0 top-0 z-[2] flex flex-col ${compact ? "gap-1" : "gap-1 sm:gap-[5px]"}`}>
        {shown.map((i) => (
          <Thumb key={swatches[i].id} s={swatches[i]} i={i} sel={sel} onPick={onPick} onHover={onHover} size={size} />
        ))}
        {rest > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Все цвета: ${swatches.length}`}
            aria-expanded={open}
            className={`grid shrink-0 place-items-center rounded-[8px] border border-[#e6e6e6] bg-white font-bold text-ink hover:border-[#b9b9b9] ${size} ${compact ? "text-[11px]" : "text-[11px] sm:text-[13px]"}`}
          >
            +{rest}
          </button>
        ) : null}
      </div>
      {open ? (
        <div
          role="dialog"
          aria-label="Все цвета"
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="absolute -inset-0.5 z-[4] grid grid-rows-[auto_minmax(0,1fr)] gap-2 rounded-[8px] border border-[#e6e6e6] bg-white/[.97] p-2 text-ink sm:p-2.5"
        >
          <div className="flex items-center justify-between gap-2 text-[12px] font-semibold">
            <span>
              {colorsLabel(swatches.length)}
              <span className="hidden font-normal text-muted sm:inline"> · {formatQty(swatches.reduce((n, s) => n + s.stock, 0))} шт.</span>
            </span>
            <button type="button" autoFocus onClick={() => setOpen(false)} aria-label="Закрыть" className="grid size-7 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink">
              <X size={16} aria-hidden />
            </button>
          </div>
          <div role="radiogroup" aria-label="Цвета" onKeyDown={arrows} className="grid grid-cols-[repeat(auto-fill,minmax(36px,1fr))] content-start gap-1.5 overflow-y-auto overflow-x-hidden overscroll-contain p-0.5">
            {swatches.map((s, i) => (
              <div key={s.id} className="grid justify-items-center gap-px text-[10px] tabular-nums text-muted">
                <Thumb
                  s={s}
                  i={i}
                  sel={sel}
                  onPick={(k) => {
                    onPick(k);
                    setOpen(false);
                  }}
                  onHover={onHover}
                  size="size-8 sm:size-9"
                  tip={false}
                />
                <span className={s.stock > 0 ? "" : "text-warn-text"}>{s.stock > 0 ? formatQty(s.stock) : "заказ"}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Вид «списком»: все цвета в ряд, остаток под каждым. */
export function ColorStrip({ swatches, sel, onPick, onHover }: Pick) {
  return (
    <div className="mt-2.5 grid gap-1.5">
      <p className="text-[12px] text-muted">
        Цвет: <b className="font-semibold text-ink">{swatches[sel].color}</b> · {colorsLabel(swatches.length)}
      </p>
      <div role="radiogroup" aria-label="Цвета" onKeyDown={arrows} className="no-scrollbar flex gap-2 overflow-x-auto p-0.5">
        {swatches.map((s, i) => (
          <div key={s.id} className="grid shrink-0 justify-items-center gap-0.5">
            <Thumb s={s} i={i} sel={sel} onPick={onPick} onHover={onHover} size="size-[38px]" tip={false} />
            <span className={`text-[11px] tabular-nums ${s.stock > 0 ? "text-muted" : "text-warn-text"}`}>{s.stock > 0 ? formatQty(s.stock) : "заказ"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** «● Цвет: желтый · 10 цветов» над названием. Строка занимает место и без цветов — карточки в ряду выровнены. */
export function ColorLine({ swatches, sel }: { swatches?: ProductSwatch[]; sel: number }) {
  const s = swatches?.[sel];
  return (
    <p className="mt-2 flex min-h-[18px] items-center gap-1.5 overflow-hidden whitespace-nowrap text-[12px] text-muted">
      {s ? (
        <>
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/15" style={{ background: s.swatch }} />
          Цвет: <b className="truncate font-semibold text-ink">{s.color}</b>
          <span className="ml-auto hidden shrink-0 text-faint sm:inline">{colorsLabel(swatches!.length)}</span>
        </>
      ) : null}
    </p>
  );
}

/** Остаток выбранного цвета меткой и, если цветов несколько, — сколько всего по модели. */
export function StockPill({ product, total, many }: { product: Product; total: number; many: boolean }) {
  return (
    <p className="mt-1.5 flex min-h-[22px] items-center gap-1.5 text-[12px] tabular-nums">
      {product.stock > 0 ? (
        <span className="rounded-full bg-new-bg px-2 py-0.5 font-semibold text-new-text">
          <span className="sr-only">На складе: </span>
          {formatQty(product.stock)} шт.
        </span>
      ) : product.preorder ? (
        <span className="rounded-full bg-warn-bg px-2 py-0.5 font-semibold text-warn-text">Под заказ</span>
      ) : (
        <span className="text-muted">Наличие уточняйте у менеджера</span>
      )}
      {many && total > 0 ? <span className="hidden text-faint sm:inline">всего {formatQty(total)}</span> : null}
    </p>
  );
}

/** Ссылка на ту же модель другой партией: «Есть дешевле: 239–278 ₽» или «Все 8 цветов по обычной цене». */
export function LotLink({ lot }: { lot: ProductLot }) {
  const cheaper = lot.kind === "cheaper";
  return (
    <Link
      href={lot.url}
      className={`mt-1.5 inline-flex max-w-full items-center gap-1 self-start rounded-full px-2 py-0.5 text-[12px] font-medium tabular-nums ${
        cheaper ? "bg-brand-soft text-brand hover:bg-brand hover:text-white" : "bg-surface text-ink hover:bg-line"
      }`}
    >
      <span className="truncate">{cheaper ? `Есть дешевле: ${lotPrice(lot)}` : lot.colors > 1 ? `Все ${colorsLabel(lot.colors)} по обычной цене` : "Обычная цена"}</span>
      <ArrowRight size={13} aria-hidden className="shrink-0" />
    </Link>
  );
}
