"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { api } from "@/lib/account/store";
import { formatPriceValue } from "@/lib/format";
import { PRINT_PRICES, calcPrice, defaultArea, fmtNum, rowFor, type PriceVariant } from "@/lib/print-prices";

const field =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] font-normal text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand";

/** Кнопка «Рассчитать нанесение»: калькулятор, если для вида есть прайс, иначе — заявка на звонок. */
export function CalcButton({ slug, title, className, children }: { slug: string; title: string; className: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const variants = PRINT_PRICES[slug];
  if (!variants)
    return (
      <Link href="/contact-us#callback" className={className}>
        {children}
      </Link>
    );
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={className}>
        {children}
      </button>
      {open ? <CalcDialog variants={variants} title={title} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function Chips({ label, items, value, onChange }: { label: string; items: { i: number; text: string }[]; value: number; onChange: (i: number) => void }) {
  return (
    <div className="mt-4">
      <p className="text-[13px] font-semibold">{label}</p>
      <div role="radiogroup" aria-label={label} className="mt-2 flex flex-wrap gap-2">
        {items.map(({ i, text }) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={i === value}
            onClick={() => onChange(i)}
            className={`rounded-full border px-4 py-2 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              i === value ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand hover:text-brand"
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function CalcDialog({ variants, title, onClose }: { variants: PriceVariant[]; title: string; onClose: () => void }) {
  const [vi, setVi] = useState(0);
  const v = variants[vi];
  const choose = v.choose ?? v.cols.map((_, i) => i);
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(choose[0]);
  const [qty, setQty] = useState("100");
  const [area, setArea] = useState(String(defaultArea(v)));
  const [addons, setAddons] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    box.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function pickVariant(i: number) {
    const next = variants[i];
    setVi(i);
    setRow(0);
    setCol((next.choose ?? [0])[0]);
    setArea(String(defaultArea(next)));
    setAddons([]);
  }

  const n = Math.min(100000, Math.max(1, Math.floor(Number(qty)) || 1));
  const input = { row, col, qty: n, area: Number(area) || 0, addons };
  const result = calcPrice(v, input);
  const tier = rowFor(v, input);
  const hasArea = !!(v.area || v.cliche);

  const summary = [
    `Способ: ${title}${variants.length > 1 ? ` — ${v.title}` : ""}`,
    ...(v.byQty ? [] : [`${v.rowLabel ?? v.rowHead}: ${v.rows[row].label}`]),
    ...(v.cols.length > 1 ? [`${v.colLabel ?? "Вариант"}: ${v.cols[col]}`] : []),
    `Тираж: ${fmtNum(n)} шт.`,
    ...(hasArea ? [`Площадь: ${area} см²`] : []),
    ...addons.map((i) => `Дополнительно: ${v.addons![i].label}`),
    `Предварительно: ${formatPriceValue(result.total)} (${formatPriceValue(result.perUnit)} за шт.)`,
  ];

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(["Имя", "Телефон", "Комментарий"].map((k) => [k, String(fd.get(k) ?? "").trim()]));
    const text = [...summary, ...Object.entries(data).filter(([, x]) => x).map(([k, x]) => `${k}: ${x}`)].join("\n");
    setBusy(true);
    setError("");
    const r = await api("/api/leads", { method: "POST", body: JSON.stringify({ kind: "calc", text, data: { ...data, Расчёт: summary.join("; ") } }) });
    setBusy(false);
    if (r.ok) setSent(true);
    else setError(r.error);
  }

  const addonPrice = (i: number) => {
    const a = v.addons![i];
    if (a.pct) return `${a.pct > 0 ? "+" : ""}${a.pct}%`;
    if (a.fixed) return `+${formatPriceValue(a.fixed)}`;
    return a.col != null ? `+${formatPriceValue(tier.prices[a.col])} за шт.` : "";
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/40 md:items-start md:p-6 md:pt-[calc(6dvh/var(--zoom))]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={box}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calc-title"
        className="flex h-full w-full flex-col overflow-hidden bg-white outline-none md:h-auto md:max-h-[calc(88dvh/var(--zoom))] md:max-w-[640px] md:rounded-[18px] md:shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 id="calc-title" className="text-[18px] font-semibold">
            Рассчитать нанесение <span className="text-muted">· {title}</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink">
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {sent ? (
            <div className="grid justify-items-center gap-3 py-10 text-center" role="status">
              <CheckCircle2 size={40} aria-hidden className="text-brand" />
              <p className="text-[18px] font-semibold">Заявка отправлена</p>
              <p className="max-w-[40ch] text-[14px] text-muted">Менеджер проверит расчёт и свяжется с вами в рабочее время.</p>
              <button type="button" onClick={onClose} className={buttonClass({ variant: "outline", size: "md" })}>Закрыть</button>
            </div>
          ) : (
            <>
              {variants.length > 1 ? (
                <Chips label="Изделие" items={variants.map((x, i) => ({ i, text: x.title }))} value={vi} onChange={pickVariant} />
              ) : null}
              {!v.byQty ? (
                <Chips label={v.rowLabel ?? v.rowHead} items={v.rows.map((r, i) => ({ i, text: r.label }))} value={row} onChange={setRow} />
              ) : null}
              {choose.length > 1 ? (
                <Chips label={v.colLabel ?? "Вариант"} items={choose.map((i) => ({ i, text: v.cols[i] }))} value={col} onChange={setCol} />
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-[13px] font-semibold">
                  Тираж, шт.
                  <input type="number" inputMode="numeric" min={1} max={100000} value={qty} onChange={(e) => setQty(e.target.value)} className={field} />
                </label>
                {hasArea ? (
                  <label className="block text-[13px] font-semibold">
                    Площадь нанесения, см²
                    <input type="number" inputMode="decimal" min={1} max={1000} value={area} onChange={(e) => setArea(e.target.value)} className={field} />
                  </label>
                ) : null}
              </div>

              {v.addons?.length ? (
                <fieldset className="mt-4">
                  <legend className="text-[13px] font-semibold">Дополнительно</legend>
                  <div className="mt-2 grid gap-2">
                    {v.addons.map((a, i) => (
                      <label key={a.label} className="flex items-start gap-2.5 text-[14px]">
                        <input
                          type="checkbox"
                          checked={addons.includes(i)}
                          onChange={(e) => setAddons((all) => (e.target.checked ? [...all, i] : all.filter((x) => x !== i)))}
                          className="mt-0.5 size-4 shrink-0 accent-[#D02E31]"
                        />
                        <span>
                          {a.label} <span className="text-muted">{addonPrice(i)}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              <div className="mt-5 rounded-[14px] bg-surface p-4" aria-live="polite">
                <p className="text-[13px] text-muted">Предварительная стоимость</p>
                <p className="mt-0.5 text-[26px] font-bold leading-tight">{formatPriceValue(result.total)}</p>
                <p className="text-[14px] text-muted">≈ {formatPriceValue(result.perUnit)} за шт.</p>
                <ul className="mt-3 grid gap-1 text-[13px] text-ink">
                  {result.lines.map((l) => <li key={l}>{l}</li>)}
                </ul>
              </div>
              <p className="mt-3 rounded-[12px] bg-brand-soft px-4 py-3 text-[13px]">
                <span className="font-semibold">Расчёт ориентировочный.</span> Точную стоимость менеджер подтвердит после проверки изделия и макета.
              </p>

              <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="block text-[13px] font-semibold">
                  Имя <span className="text-brand">*</span>
                  <input name="Имя" type="text" required autoComplete="name" className={field} />
                </label>
                <label className="block text-[13px] font-semibold">
                  Телефон <span className="text-brand">*</span>
                  <PhoneInput name="Телефон" required className={field} />
                </label>
                <label className="block text-[13px] font-semibold sm:col-span-2">
                  Комментарий
                  <textarea name="Комментарий" rows={2} maxLength={1000} placeholder="Что за изделие, где разместить логотип" className={`${field} resize-none`} />
                </label>
                <label className="flex items-start gap-2.5 text-[13px] sm:col-span-2">
                  <input type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[#D02E31]" />
                  <span>
                    Согласен на обработку{" "}
                    <Link href="/personal-data-processing" target="_blank" className="text-brand underline hover:text-brand-hover">
                      персональных данных
                    </Link>{" "}
                    <span className="text-brand">*</span>
                  </span>
                </label>
                {error ? <p role="alert" className="text-[13px] text-brand sm:col-span-2">{error}</p> : null}
                <button type="submit" disabled={busy} className={`${buttonClass({ size: "lg" })} sm:col-span-2`}>
                  {busy ? "Отправляем…" : "Отправить расчёт менеджеру"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
