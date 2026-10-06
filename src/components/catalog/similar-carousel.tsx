"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const INTERVAL = 4000;
/** Клонов с каждой стороны: не меньше максимума видимых карточек (4 + доля). */
const CLONES = 5;

/** Карусель карточек с бесконечной прокруткой (клоны — React-элементы). */
export function SimilarCarousel({ items, label }: { items: { key: string; node: ReactNode }[]; label: string }) {
  const n = items.length;
  const loop = n >= 4;
  const trackRef = useRef<HTMLUListElement>(null);
  const target = useRef(CLONES);
  const paused = useRef(false);
  const touching = useRef(false);

  const step = useCallback(() => {
    const t = trackRef.current;
    if (!t || t.children.length < 2) return 0;
    return (t.children[1] as HTMLElement).offsetLeft - (t.children[0] as HTMLElement).offsetLeft;
  }, []);

  const go = useCallback(
    (idx: number, smooth = true) => {
      const t = trackRef.current;
      const w = step();
      if (!t || !w) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.current = idx;
      t.scrollTo({ left: Math.round(idx * w), behavior: smooth && !reduce ? "smooth" : "instant" });
    },
    [step],
  );

  useEffect(() => {
    const t = trackRef.current;
    if (!t || !loop) return;
    const w0 = step();
    if (w0) t.scrollTo({ left: Math.round(CLONES * w0), behavior: "instant" });
    target.current = CLONES;

    let timeout = 0;
    const settle = () => {
      if (touching.current) return;
      const w = step();
      if (!w) return;
      const idx = Math.round(t.scrollLeft / w);
      if (idx < CLONES) go(idx + n, false);
      else if (idx >= CLONES + n) go(idx - n, false);
      else target.current = idx;
    };
    const onScroll = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(settle, 120);
    };
    const onResize = () => go(target.current, false);
    const ts = () => (touching.current = true);
    const te = () => {
      touching.current = false;
      onScroll();
    };
    t.addEventListener("scroll", onScroll, { passive: true });
    t.addEventListener("scrollend", settle);
    t.addEventListener("touchstart", ts, { passive: true });
    t.addEventListener("touchend", te, { passive: true });
    t.addEventListener("touchcancel", te, { passive: true });
    const ro = new ResizeObserver(onResize);
    ro.observe(t);

    const root = t.parentElement!;
    const enter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") paused.current = true;
    };
    const leave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") paused.current = false;
    };
    const fin = () => (paused.current = true);
    const fout = () => (paused.current = false);
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("focusin", fin);
    root.addEventListener("focusout", fout);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setInterval(() => {
      if (reduce.matches || paused.current || touching.current || document.hidden) return;
      go(target.current + 1);
    }, INTERVAL);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(timer);
      t.removeEventListener("scroll", onScroll);
      t.removeEventListener("scrollend", settle);
      t.removeEventListener("touchstart", ts);
      t.removeEventListener("touchend", te);
      t.removeEventListener("touchcancel", te);
      ro.disconnect();
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("focusin", fin);
      root.removeEventListener("focusout", fout);
    };
  }, [loop, n, go, step]);

  // Ширина слайда: 1.3 / 2.3 / 3 / 4 карточки (зазор 16px).
  const slide =
    "shrink-0 snap-start basis-[calc((100%-16px*0.3)/1.3)] md:basis-[calc((100%-16px*1.3)/2.3)] lg:basis-[calc((100%-32px)/3)] 2xl:basis-[calc((100%-48px)/4)] flex";
  const list = loop ? [...items.slice(-CLONES), ...items, ...items.slice(0, CLONES)] : items;
  // Если элементов меньше CLONES, клоны берутся с повтором.
  const pad = (from: number) => items[((from % n) + n) % n];
  const full = loop
    ? [
        ...Array.from({ length: CLONES }, (_, i) => ({ it: pad(n - CLONES + i), clone: true, k: `a${i}` })),
        ...items.map((it) => ({ it, clone: false, k: it.key })),
        ...Array.from({ length: CLONES }, (_, i) => ({ it: pad(i), clone: true, k: `z${i}` })),
      ]
    : list.map((it) => ({ it, clone: false, k: it.key }));

  const arrow =
    "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-md hover:text-brand md:flex";
  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className="relative min-w-0"
    >
      <ul
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain"
      >
        {full.map(({ it, clone, k }) => (
          <li
            key={k}
            className={slide}
            {...(clone ? { "aria-hidden": true, inert: true } : { role: "group", "aria-roledescription": "slide" })}
          >
            <div className="w-full [&>article]:h-full">{it.node}</div>
          </li>
        ))}
      </ul>
      {loop ? (
        <>
          <button type="button" aria-label="Предыдущие товары" onClick={() => go(target.current - 1)} className={`${arrow} -left-3 lg:-left-5`}>
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Следующие товары" onClick={() => go(target.current + 1)} className={`${arrow} -right-3 lg:-right-5`}>
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </>
      ) : null}
    </div>
  );
}
