"use client";

import { useId, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { num, type Option } from "./catalog-filters";

const VISIBLE = 6;
const SEARCH_FROM = 10;

export function Swatch({ bg }: { bg: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-3.5 shrink-0 rounded-full ring-1 ring-black/15"
      style={{ background: bg }}
    />
  );
}

/** Чекбокс-строка (быстрые переключатели). */
export function CheckRow({
  label,
  checked,
  onChange,
  disabled,
  title,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <label
      title={title}
      className={`flex items-center gap-2.5 rounded-md px-1.5 py-1.5 text-[14px] ${
        disabled ? "cursor-not-allowed text-faint" : "cursor-pointer text-ink hover:bg-surface"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 shrink-0 accent-brand disabled:cursor-not-allowed"
      />
      {label}
    </label>
  );
}

/** Сворачиваемая группа (кнопка + aria-expanded). */
export function FilterGroup({
  label,
  count = 0,
  defaultOpen,
  disabled,
  hint,
  children,
}: {
  label: string;
  count?: number;
  defaultOpen: boolean;
  disabled?: boolean;
  hint?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const expanded = open && !disabled;
  return (
    <div className="py-1">
      <button
        type="button"
        aria-expanded={disabled ? undefined : expanded}
        aria-controls={disabled ? undefined : id}
        aria-disabled={disabled || undefined}
        title={disabled ? hint : undefined}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`flex w-full items-center gap-2 rounded-md px-1.5 py-2 text-left text-[14px] font-semibold ${
          disabled ? "cursor-not-allowed text-faint" : "text-ink hover:text-brand"
        }`}
      >
        <span className="min-w-0 flex-1">{label}</span>
        {count ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
            {count}
          </span>
        ) : null}
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 ${disabled ? "text-faint" : "text-muted"} motion-safe:transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {disabled && hint ? <p className="px-1.5 pb-1 text-[12px] leading-snug text-faint">{hint}</p> : null}
      {expanded ? (
        <div id={id} role="group" aria-label={label} className="pb-1">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** Список чекбоксов: первые 6, «Показать все», поиск при > 10 вариантах. */
export function OptionList({
  options,
  selected,
  onToggle,
  name,
}: {
  options: Option[];
  selected: string[];
  onToggle: (value: string, on: boolean) => void;
  name: string;
}) {
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  const query = q.trim().toLowerCase();
  const shown = query
    ? options.filter((o) => o.label.toLowerCase().includes(query))
    : all
      ? options
      : options.filter((o, i) => i < VISIBLE || selected.includes(o.value));
  const more = !query && !all && options.length > shown.length;
  return (
    <>
      {options.length > SEARCH_FROM ? (
        <div className="relative mb-2">
          <Search size={15} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск"
            aria-label={`Поиск: ${name}`}
            className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] placeholder:text-faint hover:border-brand"
          />
        </div>
      ) : null}
      <ul className="space-y-0.5">
        {shown.map((o) => (
          <li key={o.value}>
            <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-[13px] hover:bg-surface">
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={(e) => onToggle(o.value, e.target.checked)}
                className="size-4 shrink-0 accent-brand"
              />
              {o.swatch ? <Swatch bg={o.swatch} /> : null}
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              <span className="text-[12px] tabular-nums text-faint">
                <span className="sr-only">товаров: </span>
                {o.count}
              </span>
            </label>
          </li>
        ))}
        {shown.length === 0 ? <li className="px-1.5 py-1 text-[13px] text-muted">Ничего не найдено</li> : null}
      </ul>
      {more ? (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="mt-1 rounded-md px-1.5 py-1.5 text-[13px] font-medium text-brand hover:text-brand-hover"
        >
          Показать все ({options.length})
        </button>
      ) : null}
      {all && !query && options.length > VISIBLE ? (
        <button
          type="button"
          onClick={() => setAll(false)}
          className="mt-1 rounded-md px-1.5 py-1.5 text-[13px] font-medium text-brand hover:text-brand-hover"
        >
          Свернуть
        </button>
      ) : null}
    </>
  );
}

/** Цена от/до: применяется при уходе фокуса из блока и по Enter. */
export function PriceFields({
  min,
  max,
  onApply,
}: {
  min: number | null;
  max: number | null;
  onApply: (min: number | null, max: number | null) => void;
}) {
  const id = useId();
  const [a, setA] = useState(min?.toString() ?? "");
  const [b, setB] = useState(max?.toString() ?? "");
  const [seen, setSeen] = useState(`${min}|${max}`);
  // Синхронизация с URL (сброс, чипы).
  if (seen !== `${min}|${max}`) {
    setSeen(`${min}|${max}`);
    setA(min?.toString() ?? "");
    setB(max?.toString() ?? "");
  }
  const commit = () => {
    const lo = num(a || null);
    const hi = num(b || null);
    if (lo !== min || hi !== max) onApply(lo, hi);
  };
  const field =
    "h-9 w-full min-w-0 rounded-lg border border-line bg-white px-3 text-[13px] text-ink placeholder:text-faint hover:border-brand";
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  };
  return (
    <div
      className="flex items-center gap-2 px-1.5"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) commit();
      }}
    >
      <label htmlFor={`${id}-min`} className="sr-only">
        Цена от
      </label>
      <input
        id={`${id}-min`}
        inputMode="numeric"
        placeholder="от"
        value={a}
        onChange={(e) => setA(e.target.value.replace(/\D/g, ""))}
        onKeyDown={key}
        className={field}
      />
      <span aria-hidden="true" className="text-muted">
        –
      </span>
      <label htmlFor={`${id}-max`} className="sr-only">
        Цена до
      </label>
      <input
        id={`${id}-max`}
        inputMode="numeric"
        placeholder="до"
        value={b}
        onChange={(e) => setB(e.target.value.replace(/\D/g, ""))}
        onKeyDown={key}
        className={field}
      />
    </div>
  );
}
