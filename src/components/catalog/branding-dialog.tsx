"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Paperclip, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { BRANDING_MAX_FILES, brandingInfo, type Branding, type BrandingFile } from "@/lib/cart/branding";

const NONE = "Без нанесения";
const kb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} МБ` : `${Math.max(1, Math.round(n / 1024))} КБ`);

/** Окно «Добавить нанесение» (как на старом сайте): способ, комментарий, логотип. */
export function BrandingDialog({
  methods,
  value,
  onSave,
  onClose,
}: {
  methods: string[];
  value: Branding | null;
  onSave: (b: Branding | null) => void;
  onClose: () => void;
}) {
  const [method, setMethod] = useState(value?.method ?? methods[0] ?? NONE);
  const [comment, setComment] = useState(value?.comment ?? "");
  const [files, setFiles] = useState<BrandingFile[]>(value?.files ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const info = method !== NONE ? brandingInfo(method) : null;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function upload(list: FileList | null) {
    const picked = Array.from(list ?? []).slice(0, BRANDING_MAX_FILES - files.length);
    if (!picked.length) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    for (const f of picked) form.append("files", f);
    try {
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = (await res.json()) as { files?: BrandingFile[]; error?: string };
      if (!res.ok || !data.files) throw new Error(data.error || "Не удалось загрузить файл");
      setFiles((all) => [...all, ...data.files!]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const chip = (m: string) => (
    <li key={m}>
      <button
        type="button"
        role="radio"
        aria-checked={m === method}
        onClick={() => setMethod(m)}
        className={`rounded-full border px-4 py-2 text-[14px] ${m === method ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand hover:text-brand"}`}
      >
        {m}
      </button>
    </li>
  );

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/40 md:items-start md:p-6 md:pt-[calc(10dvh/var(--zoom))]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="branding-title" className="flex h-full w-full flex-col overflow-hidden bg-white md:h-auto md:max-h-[calc(80dvh/var(--zoom))] md:max-w-[640px] md:rounded-[18px] md:shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="branding-title" className="text-[18px] font-semibold">Добавить нанесение</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink">
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="text-[13px] font-semibold">Способ нанесения</p>
          <ul role="radiogroup" aria-label="Способ нанесения" className="mt-2 flex flex-wrap gap-2">
            {chip(NONE)}
            {methods.map(chip)}
          </ul>
          {info ? (
            <p className="mt-3 text-[13px] text-muted">
              Срок изготовления: {info.term} · тираж: {info.run}{" "}
              <Link href={info.href} target="_blank" className="font-medium text-brand hover:text-brand-hover">Подробнее о способе</Link>
            </p>
          ) : null}

          {method !== NONE ? (
            <>
              <label className="mt-5 grid gap-1.5 text-[13px] font-semibold">
                Комментарий
                <textarea
                  value={comment}
                  maxLength={500}
                  rows={3}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Место нанесения, размер, количество цветов логотипа"
                  className="resize-none rounded-[10px] border border-line px-3.5 py-2.5 text-[14px] font-normal outline-none focus:border-ink"
                />
              </label>

              <div className="mt-5">
                <p className="text-[13px] font-semibold">Логотип или макет</p>
                <p className="mt-0.5 text-[12px] text-muted">Лучше в векторе: AI, EPS, PDF, CDR, SVG. Можно PNG или JPG. До {BRANDING_MAX_FILES} файлов, до 20 МБ каждый.</p>
                {files.length ? (
                  <ul className="mt-2 grid gap-1.5">
                    {files.map((f) => (
                      <li key={f.id} className="flex items-center gap-2 rounded-[10px] bg-surface px-3 py-2 text-[13px]">
                        <Paperclip size={14} aria-hidden className="shrink-0 text-muted" />
                        <span className="min-w-0 flex-1 truncate">{f.name}</span>
                        <span className="shrink-0 text-muted">{kb(f.size)}</span>
                        <button type="button" onClick={() => setFiles((all) => all.filter((x) => x.id !== f.id))} aria-label={`Убрать файл ${f.name}`} className="grid size-7 place-items-center rounded-full text-muted hover:text-brand">
                          <X size={14} aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {files.length < BRANDING_MAX_FILES ? (
                  <label className={`${buttonClass({ variant: "outline", size: "sm" })} mt-2 cursor-pointer`}>
                    <Paperclip size={15} aria-hidden />
                    {busy ? "Загружаем…" : "Прикрепить файл"}
                    <input ref={input} type="file" multiple disabled={busy} onChange={(e) => void upload(e.target.files)} className="sr-only" />
                  </label>
                ) : null}
                {error ? <p role="alert" className="mt-2 text-[13px] text-brand">{error}</p> : null}
              </div>
            </>
          ) : null}

          <p className="mt-5 rounded-[12px] bg-brand-soft px-4 py-3 text-[13px]">
            <span className="font-semibold">Цена без брендирования.</span> Итоговую стоимость с нанесением рассчитает менеджер после оформления заявки.
          </p>
        </div>
        <div className="flex gap-2 border-t border-line px-5 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => onSave(method === NONE ? null : { method, ...(comment.trim() ? { comment: comment.trim() } : {}), ...(files.length ? { files } : {}) })}
            className={`${buttonClass({ size: "md" })} flex-1`}
          >
            Сохранить
          </button>
          <button type="button" onClick={onClose} className={buttonClass({ variant: "outline", size: "md" })}>Отмена</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
