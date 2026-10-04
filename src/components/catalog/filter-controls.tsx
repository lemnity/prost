"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, Search } from "lucide-react";
import { num, type Option } from "./catalog-filters";

/** Закрыть текущий поповер (с возвратом фокуса на кнопку). */
const CloseContext = createContext<() => void>(() => {});
export const usePopoverClose = () => useContext(CloseContext);

const chipBase =
  "inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-[10px] bg-white px-3.5 text-[13px] shadow-[0_1px_2px_rgba(16,24,40,0.06),0_2px_8px_rgba(16,24,40,0.08)] ring-1 ring-line";
const chipDisabled = "cursor-not-allowed bg-surface text-faint shadow-none";
const chipEnabled = "text-ink hover:ring-brand/40";

export function Swatch({ bg }: { bg: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-3.5 shrink-0 rounded-full ring-1 ring-black/15"
      style={{ background: bg }}
    />
  );
}

/** Чекбокс-«чипс» в строке фильтров. */
export function CheckChip({
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
      className={`${chipBase} ${disabled ? chipDisabled : `cursor-pointer ${chipEnabled}`} ${
        checked ? "ring-brand" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-brand disabled:cursor-not-allowed"
      />
      {label}
    </label>
  );
}

/** Кнопка-выпадашка с поповером (клик, Esc, клик вне, возврат фокуса). */
export function Dropdown({
  label,
  count = 0,
  disabled,
  title,
  children,
}: {
  label: string;
  count?: number;
  disabled?: boolean;
  title?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const id = useId();

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setPos(null);
    if (refocus) btn.current?.focus();
  }, []);

  // Поповер fixed: строка фильтров прокручивается по горизонтали и обрезала бы его.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btn.current?.getBoundingClientRect();
      if (!r) return;
      const w = Math.min(300, window.innerWidth - 16);
      const top = r.bottom + 8;
      setPos({
        top,
        left: Math.max(8, Math.min(r.left, window.innerWidth - w - 8)),
        maxHeight: Math.max(160, window.innerHeight - top - 8),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  // Фокус в поповер — после позиционирования (до него он скрыт).
  const placed = pos !== null;
  useEffect(() => {
    if (open && placed) pop.current?.querySelector<HTMLElement>("input, button")?.focus();
  }, [open, placed]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!pop.current?.contains(t) && !btn.current?.contains(t)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        title={title}
        aria-disabled={disabled || undefined}
        aria-haspopup={disabled ? undefined : "dialog"}
        aria-expanded={disabled ? undefined : open}
        aria-controls={open ? id : undefined}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`${chipBase} ${disabled ? chipDisabled : chipEnabled} ${
          count || open ? "ring-brand" : ""
        }`}
      >
        {label}
        {count ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
            {count}
          </span>
        ) : null}
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`${disabled ? "text-faint" : "text-muted"} motion-safe:transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && children ? (
        <div
          ref={pop}
          id={id}
          role="dialog"
          aria-label={label}
          onBlur={(e) => {
            const t = e.relatedTarget as Node | null;
            if (t && !pop.current?.contains(t) && !btn.current?.contains(t)) close(false);
          }}
          style={pos ?? { visibility: "hidden" }}
          className="fixed z-[46] w-[min(300px,calc(100vw-16px))] overflow-y-auto overscroll-contain rounded-[12px] bg-white p-3 text-ink shadow-[0_8px_30px_rgba(16,24,40,0.16)] ring-1 ring-line"
        >
          <CloseContext.Provider value={close}>{children}</CloseContext.Provider>
        </div>
      ) : null}
    </>
  );
}

function Actions({ onApply, onReset }: { onApply: () => void; onReset: () => void }) {
  return (
    <div className="mt-3 flex gap-2 border-t border-line pt-3">
      <button
        type="button"
        onClick={onApply}
        className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-brand text-[13px] font-semibold text-white hover:bg-brand-hover"
      >
        Применить
      </button>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-line text-[13px] font-medium text-ink hover:border-brand hover:text-brand"
      >
        Сбросить
      </button>
    </div>
  );
}

/** Список чекбоксов (с поиском при > 8 вариантах). */
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
  const shown = q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;
  return (
    <>
      {options.length > 8 ? (
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
      <ul className="max-h-[260px] space-y-0.5 overflow-y-auto overscroll-contain pr-1">
        {shown.map((o) => {
          const on = selected.includes(o.value);
          return (
            <li key={o.value}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-[13px] hover:bg-surface">
                <input
                  type="checkbox"
                  aria-label={o.label}
                  checked={on}
                  onChange={(e) => onToggle(o.value, e.target.checked)}
                  className="size-4 shrink-0 accent-brand"
                />
                {o.swatch ? <Swatch bg={o.swatch} /> : null}
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                <span aria-hidden="true" className="text-[12px] text-faint">{o.count}</span>
              </label>
            </li>
          );
        })}
        {shown.length === 0 ? <li className="px-1.5 py-2 text-[13px] text-muted">Ничего не найдено</li> : null}
      </ul>
    </>
  );
}

/** Содержимое поповера со списком: черновик + «Применить»/«Сбросить». */
export function OptionsPopover({
  name,
  options,
  selected,
  onApply,
}: {
  name: string;
  options: Option[];
  selected: string[];
  onApply: (values: string[]) => void;
}) {
  const close = usePopoverClose();
  const [draft, setDraft] = useState(selected);
  return (
    <>
      <OptionList
        name={name}
        options={options}
        selected={draft}
        onToggle={(v, on) => setDraft((d) => (on ? [...d, v] : d.filter((x) => x !== v)))}
      />
      <Actions
        onApply={() => {
          onApply(draft);
          close();
        }}
        onReset={() => {
          onApply([]);
          close();
        }}
      />
    </>
  );
}

export function PriceFields({
  min,
  max,
  onMin,
  onMax,
  onEnter,
}: {
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  onEnter?: () => void;
}) {
  const id = useId();
  const field =
    "h-9 w-full min-w-0 rounded-lg border border-line bg-white px-3 text-[13px] text-ink placeholder:text-faint hover:border-brand";
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={`${id}-min`} className="sr-only">
        Цена от
      </label>
      <input
        id={`${id}-min`}
        inputMode="numeric"
        placeholder="от"
        value={min}
        onChange={(e) => onMin(e.target.value.replace(/\D/g, ""))}
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
        value={max}
        onChange={(e) => onMax(e.target.value.replace(/\D/g, ""))}
        onKeyDown={key}
        className={field}
      />
    </div>
  );
}

export function PricePopover({
  min,
  max,
  onApply,
}: {
  min: number | null;
  max: number | null;
  onApply: (min: number | null, max: number | null) => void;
}) {
  const close = usePopoverClose();
  const [a, setA] = useState(min?.toString() ?? "");
  const [b, setB] = useState(max?.toString() ?? "");
  const apply = () => {
    onApply(num(a || null), num(b || null));
    close();
  };
  return (
    <>
      <p className="mb-2 text-[13px] font-semibold">Цена, ₽</p>
      <PriceFields min={a} max={b} onMin={setA} onMax={setB} onEnter={apply} />
      <Actions
        onApply={apply}
        onReset={() => {
          onApply(null, null);
          close();
        }}
      />
    </>
  );
}

