"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

export const field =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3.5 py-3 text-[15px] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand aria-[invalid=true]:border-brand";

export type FieldProps = { id: string; "aria-invalid": boolean; "aria-describedby"?: string };

export function Field({
  name, label, required, error, hint, wide, aside, children,
}: {
  name: string; label: string; required?: boolean; error?: string; hint?: string; wide?: boolean; aside?: ReactNode;
  children: (p: FieldProps) => ReactNode;
}) {
  const id = `f-${name}`;
  const desc = [error ? `${id}-err` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label} {required ? <span className="text-brand">*</span> : null}
        </label>
        {aside}
      </div>
      {children({ id, "aria-invalid": !!error, "aria-describedby": desc })}
      {error ? <p id={`${id}-err`} className="mt-1.5 text-[13px] text-brand">{error}</p> : null}
      {hint && !error ? <p id={`${id}-hint`} className="mt-1.5 text-[12px] text-muted">{hint}</p> : null}
    </div>
  );
}

/** Поле пароля с кнопкой «показать». */
export function PasswordInput({ className = "", ...props }: ComponentProps<"input">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${field} pr-12 ${className}`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Скрыть пароль" : "Показать пароль"}
        aria-pressed={show}
        className="absolute bottom-0 right-0 grid size-12 place-items-center rounded-r-lg text-muted hover:text-brand"
      >
        {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Необязательное согласие на рекламные рассылки (38-ФЗ «О рекламе», ст. 18). */
export function MarketingCheckbox({
  checked, onChange, className = "",
}: { checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <label className={`flex items-start gap-2.5 text-[13px] text-muted ${className}`}>
      <input
        id="f-marketing"
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[#D02E31] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      />
      <span>
        Согласен получать рекламные рассылки ProStyle — новинки, акции и подборки подарков по email, SMS и в мессенджерах.
        Отписаться можно в любой момент в личном кабинете.
      </span>
    </label>
  );
}
