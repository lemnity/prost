"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ArrowUp, Clock, Folder, Search, Sparkles, X } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { ImagePlaceholder, ProductImage } from "@/components/ui/product-image";
import type { Product } from "@/lib/catalog/types";
import { AGENT } from "@/lib/chat/agent";
import { formatPriceValue, formatQty } from "@/lib/format";

/** Готовые идеи: кнопками в пустом чате, первые три — в подсказках поля поиска. */
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
const IDEAS = [HINTS[0], HINTS[1], HINTS[3]];

type Suggest = { q: string; items: Product[]; cats: { title: string; href: string; count: number }[]; total: number; exact?: boolean; failed?: boolean };
const suggestCache = new Map<string, Suggest>();

/** Запрос похож на вопрос менеджеру, а не на название товара: тогда первой предлагаем Викторию. \b с кириллицей не работает — границы через пробел. */
const QUESTION = /\?|(^|\s)(что|как|какой|какая|какие|посоветуй|подскаж|подбер|подарить|подарок|подарки|нужн|сколько|можно)|до\s?\d|\d\s?(₽|руб)/i;
const looksLikeQuestion = (q: string) => QUESTION.test(q) || q.trim().split(/\s+/).length >= 5;

/** Недавние запросы — только в браузере посетителя. */
const RECENT_KEY = "ps_search_recent";
function readRecent(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 4) : [];
  } catch {
    return [];
  }
}
function saveRecent(q: string) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...readRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 4)));
  } catch {
    // без хранилища просто не запоминаем
  }
}

const short = (q: string, n = 40) => (q.length > n ? `${q.slice(0, n)}…` : q);

/** Подсветка слов запроса в названии. */
function Marked({ text, q }: { text: string; q: string }) {
  const words = q.trim().split(/\s+/).filter((w) => w.length > 1).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!words.length) return text;
  return text.split(new RegExp(`(${words.join("|")})`, "gi")).map((part, i) =>
    i % 2 ? <mark key={i} className="rounded-[3px] bg-[#fff3c4] text-inherit">{part}</mark> : <Fragment key={i}>{part}</Fragment>,
  );
}

/** Что делает пункт подсказок: открыть чат, перейти, искать по каталогу или подставить запрос в поле. */
type Act = { kind: "vic" | "search" | "fill"; q: string } | { kind: "go"; href: string };
/** Пункт выпадающего списка: href — ссылка (можно открыть в новой вкладке). */
type Opt = { id: string; act: Act; href?: string; body: ReactNode };
type Group = { label?: ReactNode; opts: Opt[]; chips?: boolean };

const HELLO = `Здравствуйте! Меня зовут ${AGENT.firstName}, я виртуальный менеджер ProStyle, рада помочь.`;
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

/**
 * Поиск в шапке: пока человек печатает — подсказки (товары, разделы, артикул), Enter ведёт на выдачу /search.
 * Кнопка «AI» и строка Виктории в подсказках открывают чат. Без JS форма ведёт на /search.
 */
export function AiSearch({ sections }: { sections: { title: string; href: string }[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [drop, setDrop] = useState(false);
  const [sug, setSug] = useState<Suggest | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
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

  // Подсказки: запрос через 200 мс после последнего символа, прошлый запрос отменяется.
  const term = value.trim();
  useEffect(() => {
    const key = term.toLowerCase();
    const hit = suggestCache.get(key);
    if (term.length < 2 || hit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- короткий запрос или ответ уже в кэше: показываем сразу
      setSug(hit ?? null);
      return;
    }
    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = { ...((await res.json()) as Omit<Suggest, "q">), q: term };
        if (suggestCache.size > 100) suggestCache.clear();
        suggestCache.set(key, data);
        setSug(data);
      } catch {
        if (!ctl.signal.aborted) setSug({ q: term, items: [], cats: [], total: 0, failed: true });
      } finally {
        if (!ctl.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [term]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      headerInput.current?.focus();
    };
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
    setDrop(false);
    setOpen(true);
    setValue("");
    if (text.trim()) setTimeout(() => void ask(text), 300);
  }

  /** Переход из подсказок: закрываем список и снимаем фокус с поля. */
  function go(href: string) {
    setDrop(false);
    (document.activeElement as HTMLElement | null)?.blur();
    router.push(href);
  }

  function searchAll(q: string) {
    if (!q) return;
    saveRecent(q);
    go(`/search?q=${encodeURIComponent(q)}`);
  }

  function run(a: Act) {
    if (a.kind === "go") go(a.href);
    else if (a.kind === "vic") openWith(a.q);
    else if (a.kind === "search") searchAll(a.q);
    else setValue(a.q);
  }

  function openDrop() {
    setRecent(readRecent());
    setDrop(true);
  }

  // Пункты выпадающего списка по группам; порядок зависит от того, похож ли запрос на вопрос.
  // Выбранный пункт (мышью или стрелками) подсвечивается через aria-selected (group-aria-selected:).
  const question = term.length >= 2 && looksLikeQuestion(term);
  const vicOpt = (q: string, strong: boolean): Opt => ({
    id: "vic",
    act: { kind: "vic", q },
    body: (
      <span className={`flex items-center gap-3 rounded-[12px] border border-transparent p-2.5 ${strong ? "bg-brand-soft group-aria-selected:border-brand" : "group-aria-selected:bg-surface"}`}>
        <span className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- маленький аватар, без оптимизации */}
          <img src={AGENT.photo} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
          <span aria-hidden="true" className="absolute bottom-0 right-0 size-2.5 rounded-full bg-[#2BB673] ring-2 ring-white" />
        </span>
        <span className="grid min-w-0 flex-1">
          <span className="truncate text-[14px] font-semibold">{q ? `Спросить Викторию: «${short(q, 46)}»` : "Спросить Викторию"}</span>
          <span className="truncate text-[12px] text-muted">{strong ? "Подберёт товары под задачу, бюджет и тираж" : "Виртуальный менеджер, подберёт под задачу"}</span>
        </span>
        <span className="hidden shrink-0 items-center gap-1 text-[13px] font-semibold text-brand sm:flex">
          Спросить <ArrowRight size={14} aria-hidden />
        </span>
      </span>
    ),
  });
  const row = (icon: ReactNode, title: ReactNode, sub?: ReactNode, side?: ReactNode) => (
    <span className="flex items-center gap-3 rounded-[10px] px-2.5 py-2 group-aria-selected:bg-surface">
      {icon}
      <span className="grid min-w-0 flex-1">
        <span className="truncate text-[14px]">{title}</span>
        {sub ? <span className="truncate text-[12px] text-muted">{sub}</span> : null}
      </span>
      {side}
    </span>
  );
  const ico = (I: typeof Folder) => (
    <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-surface text-muted">
      <I size={16} aria-hidden />
    </span>
  );
  const chip = (text: ReactNode) => (
    <span className="block rounded-full border border-line px-3 py-1.5 text-[13px] group-aria-selected:border-brand group-aria-selected:text-brand">{text}</span>
  );
  const allOpt = (q: string): Opt => ({ id: "all", act: { kind: "search", q }, href: `/search?q=${encodeURIComponent(q)}`, body: row(ico(Search), <>Искать «{short(q)}» по всему каталогу</>) });

  const groups: Group[] = [];
  if (term.length < 2) {
    if (recent.length) groups.push({ label: "Вы искали", opts: recent.map((r, i) => ({ id: `r${i}`, act: { kind: "fill", q: r }, body: row(ico(Clock), r) })) });
    if (sections.length) groups.push({ label: "Популярные разделы", chips: true, opts: sections.map((s, i) => ({ id: `s${i}`, act: { kind: "go", href: s.href }, href: s.href, body: chip(s.title) })) });
    groups.push({ label: "Не знаете, что выбрать?", opts: [vicOpt("", false)] });
    groups.push({ chips: true, opts: IDEAS.map((h, i) => ({ id: `i${i}`, act: { kind: "vic", q: h }, body: chip(<>✦ {h}</>) })) });
  } else {
    // Пока грузится новый ответ, показываем прошлый (без мигания списка).
    const ready = sug?.q === term ? sug : null;
    const shown = ready ?? sug;
    const products: Opt[] = (shown?.items ?? []).map((p) => ({
      id: `p${p.id}`,
      act: { kind: "go", href: p.url },
      href: p.url,
      body: row(
        <span className="relative size-11 shrink-0 overflow-hidden rounded-[8px] bg-surface">
          {p.image ? <ProductImage src={p.image} alt="" sizes="44px" fallback="mini" className="object-contain" /> : <ImagePlaceholder mini />}
        </span>,
        <Marked text={p.title} q={term} />,
        <>Арт. {p.sku}</>,
        <span className="shrink-0 text-right text-[14px] font-semibold tabular-nums">
          {p.oldPrice ? <span className="mr-1.5 text-[12px] font-normal text-faint line-through">{formatPriceValue(p.oldPrice)}</span> : null}
          {formatPriceValue(p.priceFrom)}
        </span>,
      ),
    }));
    const cats: Opt[] = (shown?.cats ?? []).map((c, i) => ({ id: `c${i}`, act: { kind: "go", href: c.href }, href: c.href, body: row(ico(Folder), <Marked text={c.title} q={term} />, `${formatQty(c.count)} моделей`) }));
    const prodGroup: Group | null = products.length ? { label: ready?.exact ? "Точное совпадение по артикулу" : "Товары", opts: products } : null;
    const catGroup: Group | null = cats.length ? { label: "Разделы", opts: cats } : null;
    if (ready && !ready.failed && !products.length && !cats.length) {
      groups.push({ label: `По запросу «${short(term)}» товаров нет`, opts: [vicOpt(term, true), { id: "cat", act: { kind: "go", href: "/catalog" }, href: "/catalog", body: row(ico(Folder), "Открыть каталог", "Все разделы и фильтры") }] });
    } else if (question) {
      groups.push({ opts: [vicOpt(term, true)] }, { opts: [allOpt(term)] });
      if (prodGroup) groups.push(prodGroup);
      if (catGroup) groups.push(catGroup);
    } else {
      if (prodGroup) groups.push(prodGroup);
      if (catGroup) groups.push(catGroup);
      if (!prodGroup && !catGroup) groups.push({ label: loading ? "Ищем…" : undefined, opts: [allOpt(term)] });
      groups.push({ opts: [vicOpt(term, false)] });
    }
  }
  const opts = groups.flatMap((g) => g.opts);
  /** Номер первого пункта каждой группы в общем списке (для стрелок и aria-activedescendant). */
  const bases = groups.map((_, gi) => groups.slice(0, gi).reduce((n, g) => n + g.opts.length, 0));
  // Для вопроса строка Виктории выбрана сразу: Enter откроет чат.
  const sel = active >= 0 && active < opts.length ? active : question ? 0 : -1;
  const listId = "search-suggest";

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!drop) return openDrop();
      if (!opts.length) return;
      setActive((sel + (e.key === "ArrowDown" ? 1 : opts.length - 1) + (sel < 0 && e.key === "ArrowUp" ? 1 : 0)) % opts.length);
    } else if (e.key === "Escape" && drop) {
      e.preventDefault();
      setDrop(false);
    } else if (e.key === "Enter" && drop && sel >= 0) {
      e.preventDefault();
      run(opts[sel].act);
    }
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
      {/* На телефоне список — на всю ширину тёмной панели (она relative), с md — по ширине поля. */}
      <div role="search" className="min-w-0 flex-1 md:relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setDrop(false)}>
        <form
          action="/search"
          onSubmit={(e) => {
            e.preventDefault();
            searchAll(term);
          }}
          // Фокус — мягкий ореол снаружи: внутренняя рамка визуально сжимала поле.
          className="flex h-12 items-center overflow-hidden rounded-[10px] bg-white motion-safe:transition-shadow focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.35)]"
        >
          <input
            ref={headerInput}
            type="search"
            name="q"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setActive(-1);
              setDrop(true);
            }}
            onClick={() => !drop && openDrop()}
            onKeyDown={onKey}
            autoComplete="off"
            role="combobox"
            aria-expanded={drop}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={drop && sel >= 0 ? `${listId}-${sel}` : undefined}
            aria-label="Поиск по товарам или вопрос Виктории"
            placeholder="Товар, артикул или вопрос Виктории"
            className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm text-ink outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="submit"
            aria-label="Найти товары"
            className="flex h-12 shrink-0 items-center gap-1.5 border-l border-line px-3 text-[14px] font-semibold text-ink hover:bg-surface focus-visible:outline-ink focus-visible:-outline-offset-2 sm:px-4"
          >
            <Search size={17} aria-hidden /> <span className="hidden sm:inline">Найти</span>
          </button>
          <button
            type="button"
            onClick={() => openWith(term)}
            aria-label="Спросить Викторию, виртуального менеджера ProStyle"
            className="flex h-12 shrink-0 items-center gap-1.5 rounded-r-[10px] bg-gradient-to-r from-[#D02E31] to-[#F0643C] px-3 text-[14px] font-bold tracking-wide text-white hover:brightness-110 focus-visible:outline-ink focus-visible:-outline-offset-2 sm:px-4"
          >
            <Sparkles size={17} aria-hidden /> AI
          </button>
        </form>

        {drop ? (
          <div className="absolute inset-x-0 top-full z-[70] mt-2 flex max-h-[min(calc(70dvh/var(--zoom)),600px)] flex-col overflow-hidden rounded-[14px] border border-line bg-white text-ink shadow-2xl">
            <div id={listId} role="listbox" aria-label="Подсказки поиска" className="min-h-0 overflow-y-auto overscroll-contain">
              {groups.map((g, gi) => (
                <div key={gi} role="group" className={`grid gap-0.5 px-2 py-1.5 ${gi && g.label !== undefined ? "border-t border-line" : ""}`}>
                  {g.label ? <div className="flex justify-between gap-2 px-2.5 pb-0.5 pt-1.5 text-[11px] font-semibold uppercase tracking-[.07em] text-faint">{g.label}</div> : null}
                  <div className={g.chips ? "flex flex-wrap gap-1.5 px-2.5 pb-1.5 pt-0.5" : "grid gap-0.5"}>
                    {g.opts.map((o, k) => {
                      const i = bases[gi] + k;
                      const props = {
                        id: `${listId}-${i}`,
                        role: "option",
                        "aria-selected": sel === i,
                        className: "group block cursor-pointer text-left",
                        onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
                        onMouseEnter: () => setActive(i),
                      } as const;
                      return o.href ? (
                        <Link
                          key={o.id}
                          {...props}
                          href={o.href}
                          tabIndex={-1}
                          onClick={(e) => {
                            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                            e.preventDefault();
                            run(o.act);
                          }}
                        >
                          {o.body}
                        </Link>
                      ) : (
                        <div key={o.id} {...props} onClick={() => run(o.act)}>
                          {o.body}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {term.length >= 2 && sug?.total ? (
              <div className="flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-2.5 text-[12px] text-muted">
                <span className="hidden gap-3 md:flex">
                  <span><kbd className="rounded border border-line bg-white px-1.5">Enter</kbd> {question ? "спросить Викторию" : "все результаты"}</span>
                  <span><kbd className="rounded border border-line bg-white px-1.5">↑↓</kbd> выбор</span>
                  <span><kbd className="rounded border border-line bg-white px-1.5">Esc</kbd> закрыть</span>
                </span>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => searchAll(term)} className="ml-auto text-[13px] font-semibold text-brand hover:text-brand-hover">
                  Все результаты ({formatQty(sug.total)}) →
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

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
                    <p className="text-[12px] text-muted">{typing || hello === "typing" ? "печатает…" : "Виртуальный менеджер ProStyle · онлайн"}</p>
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
