"use client";

import { useLayoutEffect, useRef, useState, type ComponentProps } from "react";

/** Национальные цифры (10 макс.): ведущие 7/8 — код страны, 9… — первая цифра. */
function national(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d[0] === "7" || d[0] === "8") d = d.slice(1);
  return d.slice(0, 10);
}

export function formatPhone(raw: string): string {
  const d = national(raw);
  if (!d) return raw.replace(/\D/g, "") ? "+7" : "";
  let out = `+7 (${d.slice(0, 3)}`;
  if (d.length >= 3) out += ")";
  if (d.length > 3) out += ` ${d.slice(3, 6)}`;
  if (d.length > 6) out += `-${d.slice(6, 8)}`;
  if (d.length > 8) out += `-${d.slice(8, 10)}`;
  return out;
}

export const isPhoneComplete = (v: string) => national(v).length === 10;
export const PHONE_PATTERN = String.raw`\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}`;

function digitsBefore(value: string, caret: number): number {
  let n = value.slice(0, caret).replace(/\D/g, "").length;
  if (value.startsWith("+7") && caret >= 2) n -= 1;
  return Math.max(0, n);
}

function posAfter(formatted: string, n: number): number {
  if (!formatted) return 0;
  if (n <= 0) return formatted.length;
  let seen = 0;
  for (let i = 2; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) seen++;
    if (seen === n) return i + 1;
  }
  return formatted.length;
}

type Props = Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value?: string;
  onValueChange?: (v: string) => void;
};

export function PhoneInput({ value, onValueChange, ...rest }: Props) {
  const [inner, setInner] = useState("");
  const v = value ?? inner;
  const ref = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (caret.current !== null && ref.current && document.activeElement === ref.current) {
      ref.current.setSelectionRange(caret.current, caret.current);
    }
    caret.current = null;
  });

  function commit(next: string, digitsLeft: number) {
    caret.current = posAfter(next, digitsLeft);
    setInner(next);
    onValueChange?.(next);
  }

  return (
    <input
      ref={ref}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="+7 (___) ___-__-__"
      pattern={PHONE_PATTERN}
      title="Введите номер полностью"
      {...rest}
      value={v}
      onKeyDown={(e) => {
        rest.onKeyDown?.(e);
        const el = e.currentTarget;
        const pos = el.selectionStart ?? 0;
        if (e.key === "Backspace" && pos > 0 && pos === el.selectionEnd && !/\d/.test(v[pos - 1] ?? "")) {
          const n = digitsBefore(v, pos);
          if (n > 0) {
            e.preventDefault();
            const d = national(v);
            commit(formatPhone(d.slice(0, n - 1) + d.slice(n)), n - 1);
          }
        }
      }}
      onChange={(e) => {
        const raw = e.target.value;
        const n = digitsBefore(raw, e.target.selectionStart ?? raw.length);
        let next = formatPhone(raw);
        if (!national(raw) && raw.length < v.length) next = "";
        commit(next, n);
      }}
    />
  );
}
