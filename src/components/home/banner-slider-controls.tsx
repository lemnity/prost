"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const INTERVAL = 6000;

export function BannerSliderControls({ count }: { count: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  // Position in the track including the two clones: 0 = clone of last,
  // 1..count = real slides, count + 1 = clone of first.
  const rawRef = useRef(1);
  // Target of the in-flight navigation (for rapid clicks).
  const targetRef = useRef(1);
  const hoverPaused = useRef(false);
  const userPausedRef = useRef(false);
  const restartTimer = useRef<() => void>(() => {});

  const track = useCallback(
    () =>
      rootRef.current?.parentElement?.querySelector<HTMLElement>(
        "[data-banner-track]",
      ) ?? null,
    [],
  );

  const scrollToRaw = useCallback(
    (raw: number, smooth: boolean) => {
      const t = track();
      if (!t) return;
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      targetRef.current = raw;
      t.scrollTo({
        left: raw * t.clientWidth,
        behavior: smooth && !reduce ? "smooth" : "auto",
      });
    },
    [track],
  );

  const manual = useCallback(
    (raw: number) => {
      scrollToRaw(Math.max(0, Math.min(count + 1, raw)), true);
      restartTimer.current();
    },
    [scrollToRaw, count],
  );

  useEffect(() => {
    const t = track();
    const slider = t?.parentElement;
    if (!t || !slider) return;

    // Infinite loop: clone last before first and first after last.
    // Safe because the track is server-rendered and this island never re-renders
    // its children (React does not manage them), and the clones are removed in
    // the effect cleanup. Constraint: the parent must not re-render/reconcile the
    // track children in place, or the clones would be dropped or duplicated.
    const slides = Array.from(t.children) as HTMLElement[];
    const makeClone = (el: HTMLElement, eager: boolean) => {
      const c = el.cloneNode(true) as HTMLElement;
      c.removeAttribute("role");
      c.removeAttribute("aria-roledescription");
      c.removeAttribute("aria-label");
      c.setAttribute("aria-hidden", "true");
      c.dataset.bannerClone = "";
      c.querySelectorAll("img").forEach((img) => {
        img.alt = "";
        img.loading = eager ? "eager" : "lazy";
        img.removeAttribute("fetchpriority");
      });
      return c;
    };
    const first = makeClone(slides[0], false);
    const last = makeClone(slides[slides.length - 1], true);
    t.insertBefore(last, slides[0]);
    t.appendChild(first);
    // Instant jump regardless of CSS scroll-behavior.
    t.scrollTo({ left: t.clientWidth, behavior: "instant" });

    let touching = false;
    let timeout = 0;
    const jump = (raw: number) => {
      rawRef.current = raw;
      targetRef.current = raw;
      t.scrollTo({ left: raw * t.clientWidth, behavior: "instant" });
    };
    const settle = () => {
      if (touching) return;
      const w = t.clientWidth;
      if (!w) return;
      const raw = Math.round(t.scrollLeft / w);
      if (raw === 0) jump(count);
      else if (raw === count + 1) jump(1);
      else targetRef.current = raw;
    };
    const onScroll = () => {
      const w = t.clientWidth;
      if (!w) return;
      const raw = Math.round(t.scrollLeft / w);
      rawRef.current = raw;
      setActive((raw - 1 + count) % count);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(settle, 150);
    };
    const onTouchStart = () => {
      touching = true;
      restartTimer.current();
    };
    const onTouchEnd = () => {
      touching = false;
      window.clearTimeout(timeout);
      timeout = window.setTimeout(settle, 150);
      restartTimer.current();
    };
    const onResize = () => jump(rawRef.current);
    t.addEventListener("scroll", onScroll, { passive: true });
    t.addEventListener("scrollend", settle);
    t.addEventListener("touchstart", onTouchStart, { passive: true });
    t.addEventListener("touchend", onTouchEnd, { passive: true });
    t.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("resize", onResize);

    const enter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hoverPaused.current = true;
    };
    const leave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hoverPaused.current = false;
    };
    const focusIn = () => (hoverPaused.current = true);
    const focusOut = () => (hoverPaused.current = false);
    slider.addEventListener("pointerenter", enter);
    slider.addEventListener("pointerleave", leave);
    slider.addEventListener("focusin", focusIn);
    slider.addEventListener("focusout", focusOut);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer = 0;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        if (
          reduce.matches ||
          userPausedRef.current ||
          hoverPaused.current ||
          touching ||
          document.hidden
        )
          return;
        scrollToRaw(targetRef.current + 1, true);
      }, INTERVAL);
    };
    restartTimer.current = start;
    start();

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(timer);
      t.removeEventListener("scroll", onScroll);
      t.removeEventListener("scrollend", settle);
      t.removeEventListener("touchstart", onTouchStart);
      t.removeEventListener("touchend", onTouchEnd);
      t.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("resize", onResize);
      slider.removeEventListener("pointerenter", enter);
      slider.removeEventListener("pointerleave", leave);
      slider.removeEventListener("focusin", focusIn);
      slider.removeEventListener("focusout", focusOut);
      first.remove();
      last.remove();
    };
  }, [track, scrollToRaw, count]);

  const arrow =
    "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-opacity hover:bg-white md:flex [@media(hover:hover)]:md:opacity-0 [@media(hover:hover)]:md:group-hover/slider:opacity-100 focus-visible:opacity-100 group-focus-within/slider:opacity-100";

  return (
    <div ref={rootRef}>
      <button
        type="button"
        aria-label="Предыдущий слайд"
        onClick={() => manual(targetRef.current - 1)}
        className={`${arrow} left-3`}
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Следующий слайд"
        onClick={() => manual(targetRef.current + 1)}
        className={`${arrow} right-3`}
      >
        <ChevronRight size={22} aria-hidden="true" />
      </button>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center md:bottom-1">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Перейти к слайду ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
            onClick={() => manual(i + 1)}
            className="group/dot pointer-events-auto flex h-6 min-w-6 items-center justify-center"
          >
            <span
              className={`block h-2 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.45)] transition-all ${
                i === active ? "w-6 bg-brand" : "w-2 bg-white/80"
              }`}
            />
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label={userPaused ? "Запустить прокрутку" : "Остановить прокрутку"}
        onClick={() => {
          userPausedRef.current = !userPaused;
          setUserPaused(!userPaused);
          restartTimer.current();
        }}
        className="absolute right-2 bottom-2 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-md hover:bg-white md:right-3 md:bottom-3"
      >
        {userPaused ? (
          <Play size={16} aria-hidden="true" />
        ) : (
          <Pause size={16} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
