"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, Search, Sparkles, X } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import type { Product } from "@/lib/catalog/types";
import { AGENT } from "@/lib/chat/agent";

/** Подсказки: по очереди в поле поиска и кнопками в окне помощника. */
const HINTS = [
  "Подарки партнёрам на Новый год до 2000 ₽",
  "Welcome pack для новых сотрудников",
  "Термокружки с логотипом, 100 штук",
  "Что подарить коллегам на 23 февраля?",
  "Ежедневники с тиснением логотипа",
  "Эко-сувениры для выставки",
];

type Turn = { role: "user" | "assistant"; content: string; products?: Product[]; query?: string };

/** Поиск в шапке: при вводе открывается окно ИИ-помощника. Без JS форма ведёт на обычный поиск /search. */
export function AiSearch() {
  const [hint, setHint] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  /** Приветствие Виктории — после первого запроса (или сразу, если чат открыт без запроса). */
  const [greeted, setGreeted] = useState(false);
  const headerInput = useRef<HTMLInputElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const list = useRef<HTMLDivElement>(null);

  // Подсказка в поле «печатается» и стирается; при reduced motion — просто сменяется.
  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0, len = 0, deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const text = HINTS[i];
      if (calm) {
        setHint(text);
        i = (i + 1) % HINTS.length;
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
        i = (i + 1) % HINTS.length;
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
    requestAnimationFrame(() => {
      const el = input.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  function close() {
    setOpen(false);
    headerInput.current?.focus();
  }

  /** Открыть чат: сначала приветствие, затем запрос из поля поиска (если есть) уходит помощнику. */
  function openWith(text: string) {
    setOpen(true);
    if (headerInput.current) headerInput.current.value = "";
    if (text.trim()) setTimeout(() => void ask(text), 450);
  }

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Turn[] = [...turns, { role: "user", content: q }];
    setTurns(next);
    if (!turns.length && !greeted) setTimeout(() => setGreeted(true), 700);
    setDraft("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const data = (await res.json()) as { reply?: string; products?: Product[]; error?: string };
      setTurns([...next, { role: "assistant", content: data.reply ?? data.error ?? "Не удалось получить ответ", products: data.products ?? [], query: q }]);
    } catch {
      setTurns([...next, { role: "assistant", content: "Нет связи с сервером — проверьте интернет и попробуйте ещё раз.", query: q }]);
    } finally {
      setBusy(false);
    }
  }

  const bubble = "max-w-[90%] rounded-[16px] rounded-bl-[4px] bg-surface px-4 py-2.5 text-[14px]";
  /** Окно открыто без запроса — приглашение рассказать о задаче. */
  const invite = (
    <p className={bubble}>
      Здравствуйте! Меня зовут {AGENT.firstName}, я менеджер ProStyle. Помогу подобрать корпоративные подарки и сувениры из нашего каталога.
      Расскажите, для кого и к какому поводу ищете, какой бюджет и тираж — подскажу лучшие варианты. Можно просто написать название товара или артикул.
    </p>
  );
  /** Запрос уже есть — коротко представиться и взяться за него. */
  const hello = (
    <p className={bubble}>
      Здравствуйте! Меня зовут {AGENT.firstName}, я менеджер ProStyle. Сейчас посмотрю, что у нас есть по вашему запросу.
    </p>
  );

  const renderTurn = (t: Turn, i: number) =>
    t.role === "user" ? (
      <p key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-[16px] rounded-br-[4px] bg-navy px-4 py-2.5 text-[14px] text-white">
        {t.content}
      </p>
    ) : (
      <div key={i} className="grid gap-3">
        <p className="max-w-[90%] whitespace-pre-wrap rounded-[16px] rounded-bl-[4px] bg-surface px-4 py-2.5 text-[14px]">{t.content}</p>
        {t.products?.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {t.products.map((p) => (
              <li key={p.id} onClickCapture={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        ) : null}
        {t.query ? (
          <Link href={`/search?q=${encodeURIComponent(t.query)}`} onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-brand hover:text-brand-hover">
            <Search size={14} aria-hidden /> Все результаты поиска «{t.query.length > 40 ? `${t.query.slice(0, 40)}…` : t.query}»
          </Link>
        ) : null}
      </div>
    );

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
          aria-label="Поиск по товарам или вопрос ИИ-помощнику"
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

      {open && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/40 md:items-start md:p-6 md:pt-[calc(8dvh/var(--zoom))]" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div role="dialog" aria-modal="true" aria-labelledby="ai-title" className="flex h-full w-full flex-col overflow-hidden bg-white md:h-[min(calc(84dvh/var(--zoom)),780px)] md:max-w-[880px] md:rounded-[18px] md:shadow-2xl">
            <div className="flex items-center gap-3 border-b border-line px-4 py-3 md:px-5">
              <span className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- маленький аватар, без оптимизации */}
                <img src={AGENT.photo} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
                <span aria-hidden="true" className="absolute bottom-0 right-0 size-3 rounded-full bg-[#2BB673] ring-2 ring-white" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="ai-title" className="text-[16px] font-semibold leading-tight">{AGENT.name}</h2>
                <p className="text-[12px] text-muted">Менеджер ProStyle · онлайн</p>
              </div>
              <button type="button" onClick={close} aria-label="Закрыть" className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink">
                <X size={20} aria-hidden />
              </button>
            </div>

            <div ref={list} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-5" aria-live="polite">
              <div className="grid gap-4">
                {!turns.length ? (
                  <>
                    {invite}
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
                    {greeted ? (
                      <>
                    {hello}
                        {turns.slice(1).map((t, i) => renderTurn(t, i + 1))}
                      </>
                    ) : null}
                  </>
                )}
                {busy && greeted ? (
                  <p role="status" className="flex w-fit items-center gap-2 rounded-[16px] rounded-bl-[4px] bg-surface px-4 py-2.5 text-[14px] text-muted">
                    Виктория подбирает варианты
                    <span aria-hidden="true" className="flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="size-1.5 rounded-full bg-brand motion-safe:animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
                      ))}
                    </span>
                  </p>
                ) : null}
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
                placeholder="Например: подарки для IT-команды до 1500 ₽, 50 штук"
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
      ) : null}
    </>
  );
}
