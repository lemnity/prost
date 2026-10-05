"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Minus, Plus, Ruler } from "lucide-react";
import { addToCart } from "@/lib/cart/store";
import { asset } from "@/lib/asset";
import { formatPriceValue, formatQty } from "@/lib/format";

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
  /** Строки остатков (размеры); null — нет данных. */
  info: { size: string; stock: number; free: number; remote: number }[] | null;
  price: number;
};

const MAX_QTY = 99999;
const maxOf = (v: VariantView) => (v.stock != null && v.stock > 0 ? Math.min(MAX_QTY, v.stock) : MAX_QTY);

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
  const v = variants[index] ?? variants[0];
  const multi = variants.length > 1;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:gap-10">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-[10px] border border-line bg-white">
          <Image
            key={v.image}
            src={asset(v.image)}
            alt={v.title}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width:1280px) 600px, (min-width:768px) 45vw, 100vw"
            className="object-contain p-4"
          />
        </div>
        {multi ? (
          <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Фото вариантов">
            {variants.map((x, i) => (
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
                  <Image src={asset(x.image)} alt="" fill sizes="72px" className="object-contain p-1" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="min-w-0">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight md:text-[30px]">{title}</h1>

        <dl className="mt-4 space-y-2 text-[14px]">
          <div className="flex flex-wrap items-center gap-2">
            <dt className="text-muted">Артикул:</dt>
            <dd className="flex items-center gap-1 font-medium">
              {v.sku}
              <CopyButton text={v.sku} />
            </dd>
          </div>
          {brand ? (
            <div className="flex flex-wrap items-center gap-2">
              <dt className="text-muted">Поставщик:</dt>
              <dd className="font-medium">{brand}</dd>
            </div>
          ) : null}
        </dl>

        <StockCard v={v} />

        <p className="mt-5 text-[28px] font-bold leading-none">
          <span className="text-[16px] font-normal">от </span>
          {formatPriceValue(v.price)}
        </p>

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
                  <Image src={asset(x.image)} alt="" fill sizes="48px" className="object-contain p-0.5" />
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-6 flex flex-wrap items-stretch gap-3">
          <BuyBox key={v.key} variant={v} />

          <Link
            href="/contact-us#callback"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-brand bg-white px-5 text-sm font-semibold text-brand hover:bg-brand hover:text-white sm:w-auto"
          >
            <Ruler size={16} aria-hidden="true" />
            Рассчитать нанесение
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}

const SHOWN_SIZES = 3;
const REMOTE_HINT = "Поставка под заказ, срок уточняйте у менеджера";

function StockCard({ v }: { v: VariantView }) {
  const [all, setAll] = useState(false);
  const note = "mt-4 text-[14px] font-medium text-muted";
  if (v.info == null) {
    return (
      <p className={note}>
        {v.stock == null
          ? "Наличие уточняйте у менеджера"
          : v.stock > 0
            ? `В наличии: ${formatQty(v.stock)} шт.`
            : "Под заказ"}
      </p>
    );
  }
  const rows = v.info;
  const hasRemote = rows.some((r) => r.remote > 0);
  if (!hasRemote && rows.every((r) => r.stock <= 0 && r.free <= 0)) {
    return <p className={note}>Под заказ — срок уточняйте у менеджера</p>;
  }
  const sized = rows.length > 1;
  const shown = all || rows.length <= SHOWN_SIZES ? rows : rows.slice(0, SHOWN_SIZES);
  const th = "px-4 py-2.5 text-[13px] font-semibold text-ink";
  const td = "px-4 py-2.5 text-[16px] font-semibold tabular-nums text-brand";
  return (
    <div className="mt-4 max-w-[520px] overflow-hidden rounded-[14px] border border-line bg-white shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            {sized ? <th scope="col" className={th}>Размер</th> : null}
            <th scope="col" className={th}>На складе</th>
            <th scope="col" className={th}>Доступно</th>
            {hasRemote ? (
              <th scope="col" className={th} title={REMOTE_HINT}>
                Удалённый склад
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={`${r.size}-${i}`} className="border-b border-line last:border-b-0">
              {sized ? <th scope="row" className="px-4 py-2.5 text-[14px] font-medium text-ink">{r.size || "—"}</th> : null}
              <td className={td}>{formatQty(r.stock)}</td>
              <td className={td}>{formatQty(r.free)}</td>
              {hasRemote ? <td className={td}>{formatQty(r.remote)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
      {shown.length < rows.length ? (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="w-full border-t border-line px-4 py-2.5 text-left text-[13px] font-medium text-brand hover:text-brand-hover"
        >
          Показать все размеры ({rows.length})
        </button>
      ) : null}
      {hasRemote ? <p className="border-t border-line bg-surface px-4 py-2 text-[12px] text-muted">{REMOTE_HINT}</p> : null}
    </div>
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

function BuyBox({ variant: v }: { variant: VariantView }) {
  const [qty, setQty] = useState(1);
  const [draft, setDraft] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const max = maxOf(v);
  const clamp = (n: number) => Math.min(max, Math.max(1, Math.floor(n) || 1));

  if (v.stock == null || v.stock <= 0) {
    return (
      <Link
        href="/contact-us#callback"
        className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-brand px-8 text-sm font-semibold text-white hover:bg-brand-hover sm:w-auto"
      >
        Запросить
      </Link>
    );
  }

  const btn = "grid size-12 shrink-0 place-items-center text-ink hover:text-brand disabled:text-faint";
  return (
    <>
      <div role="group" aria-label="Количество" className="inline-flex h-12 items-center rounded-[10px] border border-line bg-white">
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
          className="h-full w-16 min-w-0 bg-transparent text-center text-[14px] font-semibold tabular-nums outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
        />
        <button type="button" aria-label="Увеличить количество" disabled={qty >= max} onClick={() => setQty((q) => clamp(q + 1))} className={btn}>
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          const n = draft !== null ? clamp(parseInt(draft, 10)) : qty;
          setQty(n);
          setDraft(null);
          addToCart({ id: v.id, sku: v.sku, title: v.title, image: v.image, url: v.url, price: v.price }, n);
          setAdded(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setAdded(false), 2500);
        }}
        className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-brand px-8 text-sm font-semibold text-white hover:bg-brand-hover sm:flex-none"
      >
        {added ? (
          <>
            Добавлено <Check size={16} aria-hidden="true" />
          </>
        ) : (
          "В корзину"
        )}
      </button>
      <span role="status" className="sr-only">
        {added ? "Добавлено в корзину" : ""}
      </span>
      {added ? (
        <Link href="/cart" className="order-last basis-full text-[13px] font-medium text-brand hover:text-brand-hover">
          Перейти в корзину
        </Link>
      ) : null}
    </>
  );
}
