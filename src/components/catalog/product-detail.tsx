"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Info, Minus, Plus, Ruler } from "lucide-react";
import { addToCart } from "@/lib/cart/store";
import { asset } from "@/lib/asset";
import { formatPriceValue, formatQty } from "@/lib/format";
import { ProductImage } from "@/components/ui/product-image";

type SizeRow = { size: string; stock: number; free: number; remote: number };

export type VariantView = {
  key: string;
  label: string;
  image: string;
  /** Данные позиции для корзины и карточки. */
  id: string;
  url: string;
  title: string;
  sku: string;
  /** null — наличие неизвестно (по запросу). */
  stock: number | null;
  /** Строки остатков (размеры), отсортированы; null — нет данных. */
  info: SizeRow[] | null;
  price: number;
};

const MAX_QTY = 99999;
const SHOWN_SIZES = 3;

type Avail = { known: boolean; free: number; remote: number };

function defaultSize(v: VariantView): string {
  const rows = v.info ?? [];
  return (rows.find((r) => r.free > 0) ?? rows.find((r) => r.remote > 0) ?? rows[0])?.size ?? "";
}

function availOf(v: VariantView, row: SizeRow | undefined): Avail {
  if (row) return { known: true, free: row.free, remote: row.remote };
  return { known: v.stock != null, free: v.stock ?? 0, remote: 0 };
}

export function ProductDetail({
  title,
  brand,
  variants,
  initial,
  children,
}: {
  title: string;
  brand: string;
  variants: VariantView[];
  initial: number;
  /** Слот под ценой (ссылки на нанесение и т. п.). */
  children?: React.ReactNode;
}) {
  const [index, setIndex] = useState(initial);
  const [pick, setPick] = useState<{ key: string; size: string } | null>(null);
  const [bad, setBad] = useState<ReadonlySet<string>>(new Set());
  const v = variants[index] ?? variants[0];
  const multi = variants.length > 1;
  const rows = v.info ?? [];
  const sized = rows.length > 1;
  const size = sized ? (pick?.key === v.key ? pick.size : defaultSize(v)) : "";
  const row = sized ? rows.find((r) => r.size === size) : rows[0];
  const avail = availOf(v, row);
  const markBad = (src: string) => setBad((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-[10px] border border-line bg-white">
          <ProductImage
            key={v.image}
            src={asset(v.image)}
            alt={v.title}
            loading="eager"
            fetchPriority="high"
            sizes="(min-width:1280px) 600px, (min-width:768px) 45vw, 100vw"
            className="object-contain p-4"
            onFail={() => markBad(v.image)}
          />
        </div>
        {multi ? (
          <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Фото вариантов">
            {variants.map((x, i) =>
              bad.has(x.image) ? null : (
                <li key={x.key} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Фото: ${x.label}`}
                    aria-pressed={i === index}
                    className={`relative block size-16 overflow-hidden rounded-lg border bg-white md:size-[72px] ${
                      i === index ? "border-brand ring-1 ring-brand" : "border-line hover:border-brand"
                    }`}
                  >
                    <ProductImage
                      src={asset(x.image)}
                      alt=""
                      sizes="72px"
                      className="object-contain p-1"
                      onFail={() => markBad(x.image)}
                    />
                  </button>
                </li>
              ),
            )}
          </ul>
        ) : null}
      </div>

      <div className="min-w-0">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight md:text-[30px]">{title}</h1>

        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1">
            Арт. {v.sku}
            <CopyButton text={v.sku} />
          </span>
          {brand ? (
            <>
              <span aria-hidden="true">·</span>
              <span>Поставщик: {brand}</span>
            </>
          ) : null}
        </p>

        <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-[32px] font-bold leading-none">
            <span className="text-[16px] font-normal">от </span>
            {formatPriceValue(v.price)}
          </p>
          <span className="text-[14px] text-muted">за шт.</span>
          <span className="w-full text-[12px] text-muted sm:ml-auto sm:w-auto">Цена без нанесения</span>
        </div>

        <StockLine avail={avail} />

        {multi ? (
          <fieldset className="mt-5">
            <legend className="mb-2 text-[13px] font-semibold">
              Вариант: <span className="font-normal text-muted">{v.label}</span>
            </legend>
            <div role="radiogroup" aria-label="Вариант товара" className="flex flex-wrap gap-2">
              {variants.map((x, i) => (
                <button
                  key={x.key}
                  type="button"
                  role="radio"
                  aria-checked={i === index}
                  title={x.label}
                  onClick={() => setIndex(i)}
                  className={`relative size-12 overflow-hidden rounded-lg border bg-white ${
                    i === index ? "border-brand ring-1 ring-brand" : "border-line hover:border-brand"
                  }`}
                >
                  <span className="sr-only">{x.label}</span>
                  <ProductImage
                    src={asset(x.image)}
                    alt=""
                    sizes="48px"
                    fallback="mini"
                    className="object-contain p-0.5"
                    onFail={() => markBad(x.image)}
                  />
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {sized ? (
          <SizePicker
            key={v.key}
            rows={rows}
            size={size}
            onPick={(sz) => setPick({ key: v.key, size: sz })}
          />
        ) : null}

        <div className="@container mt-6">
          <BuyBox
            key={`${v.key}|${size}`}
            variant={v}
            size={size}
            avail={avail}
            calc={
              <Link
                href="/contact-us#callback"
                className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-brand bg-white px-4 text-sm font-semibold text-brand hover:bg-brand hover:text-white @md:w-auto"
              >
                <Ruler size={16} aria-hidden="true" />
                Рассчитать нанесение
              </Link>
            }
          />
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted">
            <Info size={14} aria-hidden="true" className="shrink-0" />
            Минимальная сумма заказа — 10&nbsp;000&nbsp;₽
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}

/** Единая строка наличия для всех товаров. */
function StockLine({ avail }: { avail: Avail }) {
  const num = "font-semibold tabular-nums";
  let main: React.ReactNode;
  if (!avail.known) {
    main = <span className="text-muted">Наличие уточняйте у менеджера</span>;
  } else if (avail.free > 0) {
    main = (
      <>
        <Dot tone="ok" />
        <span>
          В наличии: <span className={num}>{formatQty(avail.free)} шт.</span>
        </span>
      </>
    );
  } else if (avail.remote > 0) {
    main = (
      <>
        <Dot tone="warn" />
        <span className="text-amber-700">
          Под заказ — удалённый склад: <span className={num}>{formatQty(avail.remote)} шт.</span>
        </span>
      </>
    );
  } else {
    main = <span className="text-muted">Под заказ — срок уточняйте у менеджера</span>;
  }
  return (
    <div className="mt-4 space-y-1" aria-live="polite">
      <p className="flex items-start gap-2 text-[14px]">{main}</p>
      {avail.known && avail.free > 0 && avail.remote > 0 ? (
        <p className="flex items-start gap-2 text-[13px] text-muted">
          <Dot tone="warn" small />
          <span>Удалённый склад: {formatQty(avail.remote)} шт. — поставка под заказ</span>
        </p>
      ) : null}
    </div>
  );
}

function Dot({ tone, small = false }: { tone: "ok" | "warn"; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 rounded-full ${small ? "mt-[6px] size-1.5" : "mt-[7px] size-2"} ${
        tone === "ok" ? "bg-new-text" : "bg-amber-500"
      }`}
    />
  );
}

function SizePicker({
  rows,
  size,
  onPick,
}: {
  rows: SizeRow[];
  size: string;
  onPick: (s: string) => void;
}) {
  const [table, setTable] = useState(false);
  const [all, setAll] = useState(false);
  const hasRemote = rows.some((r) => r.remote > 0);
  const shown = all || rows.length <= SHOWN_SIZES ? rows : rows.slice(0, SHOWN_SIZES);
  const th = "px-3 py-1.5 text-left text-[12px] font-semibold text-muted";
  const td = "px-3 py-1.5 text-[13px] font-semibold tabular-nums";
  return (
    <fieldset className="mt-5">
      <legend className="mb-2 text-[13px] font-semibold">
        Размер: <span className="font-normal text-muted">{size || "—"}</span>
      </legend>
      <div role="radiogroup" aria-label="Размер" className="flex flex-wrap gap-2">
        {rows.map((r) => {
          const none = r.free <= 0 && r.remote <= 0;
          const on = r.size === size;
          return (
            <button
              key={r.size}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={none}
              onClick={() => onPick(r.size)}
              className={`h-10 min-w-11 rounded-lg border px-3 text-[14px] font-medium ${
                on
                  ? "border-brand bg-brand-soft text-brand ring-1 ring-brand"
                  : none
                    ? "cursor-not-allowed border-line bg-surface text-faint line-through"
                    : r.free <= 0
                      ? "border-line bg-white text-faint hover:border-brand"
                      : "border-line bg-white text-ink hover:border-brand"
              }`}
            >
              {r.size || "—"}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-expanded={table}
        onClick={() => setTable((t) => !t)}
        className="mt-2 text-[13px] font-medium text-brand hover:text-brand-hover"
      >
        Наличие по размерам
      </button>
      {table ? (
        <div className="mt-2 max-w-[460px] rounded-[12px] bg-surface p-1">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th scope="col" className={th}>Размер</th>
                <th scope="col" className={th}>Доступно</th>
                {hasRemote ? <th scope="col" className={th}>Удалённый склад</th> : null}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.size} className="border-t border-line/70">
                  <th scope="row" className="px-3 py-1.5 text-left text-[13px] font-medium">{r.size || "—"}</th>
                  <td className={td}>{formatQty(r.free)}</td>
                  {hasRemote ? <td className={`${td} text-muted`}>{formatQty(r.remote)}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length < rows.length ? (
            <button
              type="button"
              onClick={() => setAll(true)}
              className="w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium text-brand hover:text-brand-hover"
            >
              Показать все размеры ({rows.length})
            </button>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <>
      <button
        type="button"
        aria-label="Скопировать артикул"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setDone(true);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setDone(false), 1500);
          } catch {}
        }}
        className="grid size-7 place-items-center rounded text-muted hover:text-brand"
      >
        {done ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
      </button>
      <span role="status" className="sr-only">
        {done ? "Артикул скопирован" : ""}
      </span>
    </>
  );
}

function BuyBox({
  variant: v,
  size,
  avail,
  calc,
}: {
  variant: VariantView;
  size: string;
  avail: Avail;
  calc: React.ReactNode;
}) {
  const [qty, setQty] = useState(1);
  const [draft, setDraft] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const inStock = avail.known && avail.free > 0;
  const max = inStock ? Math.min(MAX_QTY, avail.free) : MAX_QTY;
  const clamp = (n: number) => Math.min(max, Math.max(1, Math.floor(n) || 1));
  const n = draft !== null ? clamp(parseInt(draft, 10)) : qty;
  const btn = "grid size-11 shrink-0 place-items-center text-ink hover:text-brand disabled:text-faint";
  return (
    <>
      <div className="flex flex-wrap items-stretch gap-3">
        <div role="group" aria-label="Количество" className="inline-flex h-12 w-32 shrink-0 items-center rounded-[10px] border border-line bg-white">
          <button type="button" aria-label="Уменьшить количество" disabled={qty <= 1} onClick={() => setQty((q) => clamp(q - 1))} className={btn}>
            <Minus size={16} aria-hidden="true" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            aria-label="Количество"
            value={draft ?? String(qty)}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
            onBlur={() => {
              if (draft !== null) setQty(clamp(parseInt(draft, 10)));
              setDraft(null);
            }}
            className="h-full w-0 min-w-0 flex-1 bg-transparent text-center text-[14px] font-semibold tabular-nums outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
          />
          <button type="button" aria-label="Увеличить количество" disabled={qty >= max} onClick={() => setQty((q) => clamp(q + 1))} className={btn}>
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setQty(n);
            setDraft(null);
            addToCart(
              {
                id: size ? `${v.id}:${size}` : v.id,
                sku: v.sku,
                title: size ? `${v.title}, размер ${size}` : v.title,
                image: v.image,
                url: v.url,
                price: v.price,
                ...(inStock ? {} : { preorder: true }),
              },
              n,
            );
            setAdded(true);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setAdded(false), 2500);
          }}
          className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          {added ? (
            <>
              Добавлено <Check size={16} aria-hidden="true" />
            </>
          ) : inStock ? (
            "В корзину"
          ) : (
            "Запросить"
          )}
        </button>
        {calc}
      </div>
      <p aria-live="polite" className="mt-2 text-[13px] text-muted">
        Итого: {formatQty(n)} шт. × {formatPriceValue(v.price)} ={" "}
        <span className="font-semibold text-ink">{formatPriceValue(Math.round(v.price * n * 100) / 100)}</span>
        {!inStock ? " · под заказ" : ""}
      </p>
      <span role="status" className="sr-only">
        {added ? "Добавлено в корзину" : ""}
      </span>
      {added ? (
        <Link href="/cart" className="mt-1 inline-block text-[13px] font-medium text-brand hover:text-brand-hover">
          Перейти в корзину
        </Link>
      ) : null}
    </>
  );
}
