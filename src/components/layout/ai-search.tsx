"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, Search, Sparkles, X } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import type { Product } from "@/lib/catalog/types";
import { AGENT } from "@/lib/chat/agent";

/** Готовые идеи: первые — по очереди «печатаются» в поле поиска, все — кнопками в пустом чате. */
const HINTS = [
  "Подарки партнёрам на Новый год до 2000 ₽",
  "Welcome pack для новых сотрудников",
  "Термокружки с логотипом, 100 штук",
  "Что подарить коллегам на 23 февраля?",
  "Подарки сотрудницам на 8 Марта",
  "Ежедневники с тиснением логотипа",
  "Эко-сувениры для выставки",
  "Мерч для IT-компании: худи и футболки",
  "Подарки VIP-клиентам до 10 000 ₽",
  "Промо-сувениры для конференции до 300 ₽",
  "Повербанки с логотипом",
  "Какая сегодня погода в Тюмени?",
];
const FIELD_HINTS = HINTS.slice(0, 7);

const HELLO = `Здравствуйте! Меня зовут ${AGENT.firstName}, я менеджер ProStyle, рада помочь.`;
const BUBBLE = "max-w-[90%] whitespace-pre-wrap rounded-[16px] rounded-bl-[4px] bg-surface px-4 py-2.5 text-[14px]";

type Turn = { role: "user" | "assistant"; content: string; products?: Product[]; query?: string; typed?: boolean };
/** Знакомство после первого запроса: пауза «печатает» → приветствие набирается → готово. */
type Hello = "none" | "dots" | "typing" | "done";

const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Текст «набирается» по буквам, как у живого собеседника. */
function Typed({ text, onDone, onTick }: { text: string; onDone?: () => void; onTick?: () => void }) {
  const [n, setN] = useState(0);
  const done = useRef(onDone);
  const tick = useRef(onTick);
  useEffect(() => {
    done.current = onDone;
    tick.current = onTick;
  });
  useEffect(() => {
    if (calm()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- без анимации текст показываем сразу
      setN(text.length);
      done.current?.();
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      // Скорость «набора»: на знаках препинания — чуть медленнее.
      i = Math.min(text.length, i + (/[.,!?—\n]/.test(text[i] ?? "") ? 1 : 3));
      setN(i);
      tick.current?.();
      if (i >= text.length) {
        clearInterval(id);
        done.current?.();
      }
    }, 22);
    return () => clearInterval(id);
  }, [text]);
  return (
    <>
      {text.slice(0, n)}
      {n < text.length ? <span aria-hidden="true" className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-ink/60" /> : null}
    </>
  );
}

function Dots({ label }: { label: string }) {
  return (
    <p role="status" className="flex w-fit items-center gap-2 rounded-[16px] rounded-bl-[4px] bg-surface px-4 py-2.5 text-[14px] text-muted">
      {label}
      <span aria-hidden="true" className="flex gap-1">
        {[0, 1, 2].map((d) => (
          <span key={d} className="size-1.5 rounded-full bg-brand motion-safe:animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
        ))}
      </span>
    </p>
  );
}

/** Поиск в шапке: по Enter или кнопке «AI» открывается чат с Викторией. Без JS форма ведёт на обычный поиск /search. */
export function AiSearch() {
  const [hint, setHint] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [hello, setHello] = useState<Hello>("none");
  /** Следующие части ответа (ещё рекомендую, вопрос) — приходят по одной после «печатает». */
  const queue = useRef<Turn[]>([]);
  const [between, setBetween] = useState(false);
  const headerInput = useRef<HTMLInputElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const list = useRef<HTMLDivElement>(null);

  // Подсказка в поле «печатается» и стирается; при reduced motion — просто сменяется.
  useEffect(() => {
    const still = calm();
    let i = 0, len = 0, deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const text = FIELD_HINTS[i];
      if (still) {
        setHint(text);
        i = (i + 1) % FIELD_HINTS.length;
        timer = setTimeout(tick, 3500);
        return;
      }
      len += deleting ? -1 : 1;
      setHint(text.slice(0, len));
      let delay = deleting ? 22 : 55;
      if (!deleting && len >= text.length) {
        deleting = true;
        delay = 1800;
      } else if (deleting && len <= 0) {
        deleting = false;
        i = (i + 1) % FIELD_HINTS.length;
        delay = 400;
      }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => input.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toBottom = () => list.current?.scrollTo({ top: list.current.scrollHeight });

  // Готовый ответ с карточками — показываем начало ответа; в остальное время — низ переписки.
  useEffect(() => {
    const box = list.current;
    if (!box) return;
    const last = turns[turns.length - 1];
    const answers = box.querySelectorAll<HTMLElement>("[data-answer]");
    const el = answers[answers.length - 1];
    if (last?.role === "assistant" && last.typed && el && last.products?.length) box.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
    else box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [turns, busy, hello]);

  function close() {
    setOpen(false);
    headerInput.current?.focus();
  }

  function openWith(text: string) {
    setOpen(true);
    if (headerInput.current) headerInput.current.value = "";
    if (text.trim()) setTimeout(() => void ask(text), 300);
  }

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy || between || queue.current.length) return;
    const next: Turn[] = [...turns, { role: "user", content: q }];
    setTurns(next);
    setDraft("");
    setBusy(true);
    // Первый запрос: Виктория «читает», затем знакомится — ответ покажется после приветствия.
    if (hello === "none") {
      setHello("dots");
      setTimeout(() => setHello("typing"), 1100);
    }
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const data = (await res.json()) as { reply?: string; products?: Product[]; parts?: { text: string; products: Product[] }[]; error?: string };
      const parts = data.parts?.length ? data.parts : [{ text: data.reply ?? data.error ?? "Не удалось получить ответ", products: data.products ?? [] }];
      const [first, ...rest] = parts.map((p, k): Turn => ({ role: "assistant", content: p.text, products: p.products, query: k === 0 && p.products.length ? q : undefined }));
      queue.current = rest;
      setTurns([...next, first]);
    } catch {
      setTurns([...next, { role: "assistant", content: "Ой, связь прервалась, попробуйте отправить сообщение ещё раз.", query: q }]);
    } finally {
      setBusy(false);
    }
  }

  // Часть ответа набрана — через паузу «печатает» показываем следующую.
  const markTyped = (i: number) => {
    setTurns((all) => all.map((t, k) => (k === i ? { ...t, typed: true } : t)));
    const nextPart = queue.current.shift();
    if (!nextPart) return;
    setBetween(true);
    setTimeout(() => {
      setBetween(false);
      setTurns((all) => [...all, nextPart]);
    }, nextPart.products?.length ? 1400 : 1000);
  };

  const renderTurn = (t: Turn, i: number) =>
    t.role === "user" ? (
      <p key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-[16px] rounded-br-[4px] bg-navy px-4 py-2.5 text-[14px] text-white">
        {t.content}
      </p>
    ) : (
      <div key={i} data-answer className="grid gap-3">
        <p className={BUBBLE}>{t.typed ? t.content : <Typed text={t.content} onTick={toBottom} onDone={() => markTyped(i)} />}</p>
        {t.typed && t.products?.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {t.products.map((p) => (
              <li key={p.id} onClickCapture={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        ) : null}
        {t.typed && t.query && t.products?.length ? (
          <Link href={`/search?q=${encodeURIComponent(t.query)}`} onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-brand hover:text-brand-hover">
            <Search size={14} aria-hidden /> Все результаты поиска «{t.query.length > 40 ? `${t.query.slice(0, 40)}…` : t.query}»
          </Link>
        ) : null}
      </div>
    );

  const typing = hello === "dots" || (hello === "done" && (busy || between));

  return (
    <>
      <form
        action="/search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          openWith(headerInput.current?.value ?? "");
        }}
        className="flex h-12 min-w-0 flex-1 items-center overflow-hidden rounded-[10px] bg-white focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-ink"
      >
        <input
          ref={headerInput}
          type="search"
          name="q"
          autoComplete="off"
          aria-label="Поиск по товарам или вопрос менеджеру"
          placeholder={hint || "Поиск по товарам и артикулам"}
          className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm text-ink outline-none placeholder:text-faint"
        />
        <button
          type="submit"
          aria-label="Спросить Викторию, менеджера ProStyle"
          className="flex h-12 shrink-0 items-center gap-1.5 rounded-r-[10px] bg-gradient-to-r from-[#D02E31] to-[#F0643C] px-4 text-[14px] font-bold tracking-wide text-white hover:brightness-110 focus-visible:outline-ink focus-visible:-outline-offset-2"
        >
          <Sparkles size={17} aria-hidden /> AI
        </button>
      </form>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/40 md:items-start md:p-6 md:pt-[calc(8dvh/var(--zoom))]"
              onMouseDown={(e) => e.target === e.currentTarget && close()}
            >
              <div role="dialog" aria-modal="true" aria-labelledby="ai-title" className="flex h-full w-full flex-col overflow-hidden bg-white md:h-[min(calc(84dvh/var(--zoom)),780px)] md:max-w-[880px] md:rounded-[18px] md:shadow-2xl">
                <div className="flex items-center gap-3 border-b border-line px-4 py-3 md:px-5">
                  <span className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element -- маленький аватар, без оптимизации */}
                    <img src={AGENT.photo} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
                    <span aria-hidden="true" className="absolute bottom-0 right-0 size-3 rounded-full bg-[#2BB673] ring-2 ring-white" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 id="ai-title" className="text-[16px] font-semibold leading-tight">{AGENT.name}</h2>
                    <p className="text-[12px] text-muted">{typing || hello === "typing" ? "печатает…" : "Менеджер ProStyle · онлайн"}</p>
                  </div>
                  <button type="button" onClick={close} aria-label="Закрыть" className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink">
                    <X size={20} aria-hidden />
                  </button>
                </div>

                <div ref={list} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-5" aria-live="polite">
                  <div className="grid gap-4">
                    {!turns.length ? (
                      <>
                        <p className={BUBBLE}>
                          Здравствуйте! Подскажу с выбором корпоративных подарков и сувениров. Расскажите, для кого и к какому поводу ищете, какой бюджет и тираж, или выберите готовую идею:
                        </p>
                        <ul className="flex flex-wrap gap-2">
                          {HINTS.map((h) => (
                            <li key={h}>
                              <button type="button" onClick={() => void ask(h)} className="rounded-full border border-line px-3.5 py-2 text-left text-[13px] hover:border-brand hover:text-brand">
                                {h}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <>
                        {renderTurn(turns[0], 0)}
                        {hello === "typing" ? (
                          <p className={BUBBLE}>
                            <Typed text={HELLO} onTick={toBottom} onDone={() => setTimeout(() => setHello("done"), 350)} />
                          </p>
                        ) : hello === "done" ? (
                          <p className={BUBBLE}>{HELLO}</p>
                        ) : null}
                        {hello === "done" ? turns.slice(1).map((t, i) => renderTurn(t, i + 1)) : null}
                      </>
                    )}
                    {typing ? <Dots label={`${AGENT.firstName} печатает`} /> : null}
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void ask(draft);
                  }}
                  className="flex items-end gap-2 border-t border-line p-3 md:px-5"
                >
                  <textarea
                    ref={input}
                    rows={1}
                    value={draft}
                    maxLength={1000}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void ask(draft);
                      }
                    }}
                    placeholder="Напишите сообщение…"
                    aria-label="Сообщение Виктории"
                    className="max-h-32 min-h-11 flex-1 resize-none rounded-[12px] border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-ink"
                  />
                  <button type="submit" disabled={busy || !draft.trim()} aria-label="Отправить" className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-white hover:bg-brand-hover disabled:opacity-40">
                    <ArrowUp size={20} aria-hidden />
                  </button>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
