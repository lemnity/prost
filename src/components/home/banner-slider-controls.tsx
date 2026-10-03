"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const INTERVAL = 6000;

export function BannerSliderControls({ count }: { count: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Position in the track including the two clones: 0 = clone of last,
  // 1..count = real slides, count + 1 = clone of first.
  const rawRef = useRef(1);
  const paused = useRef(false);

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
      t.scrollTo({
        left: raw * t.clientWidth,
        behavior: smooth ? "smooth" : "instant",
      });
    },
    [track],
  );

  const goTo = useCallback(
    (i: number) => scrollToRaw(i + 1, true),
    [scrollToRaw],
  );
  const step = useCallback(
    (d: number) => scrollToRaw(rawRef.current + d, true),
    [scrollToRaw],
  );

  useEffect(() => {
    const t = track();
    const slider = t?.parentElement;
    if (!t || !slider) return;

    // Infinite loop: clone last before first and first after last.
    const slides = Array.from(t.children) as HTMLElement[];
    const makeClone = (el: HTMLElement) => {
      const c = el.cloneNode(true) as HTMLElement;
      c.removeAttribute("role");
      c.removeAttribute("aria-roledescription");
      c.removeAttribute("aria-label");
      c.setAttribute("aria-hidden", "true");
      c.dataset.bannerClone = "";
      c.querySelectorAll("img").forEach((img) => {
        img.alt = "";
        img.loading = "lazy";
        img.removeAttribute("fetchpriority");
      });
      return c;
    };
    const first = makeClone(slides[0]);
    const last = makeClone(slides[slides.length - 1]);
    t.insertBefore(last, slides[0]);
    t.appendChild(first);
    scrollToRaw(1, false);

    let timeout = 0;
    const settle = () => {
      const w = t.clientWidth;
      if (!w) return;
      const raw = Math.round(t.scrollLeft / w);
      if (raw === 0) {
        rawRef.current = count;
        scrollToRaw(count, false);
      } else if (raw === count + 1) {
        rawRef.current = 1;
        scrollToRaw(1, false);
      }
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
    const onResize = () => scrollToRaw(rawRef.current, false);
    t.addEventListener("scroll", onScroll, { passive: true });
    t.addEventListener("scrollend", settle);
    window.addEventListener("resize", onResize);

    const pause = () => (paused.current = true);
    const resume = () => (paused.current = false);
    slider.addEventListener("mouseenter", pause);
    slider.addEventListener("mouseleave", resume);
    slider.addEventListener("focusin", pause);
    slider.addEventListener("focusout", resume);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setInterval(() => {
      if (reduce.matches || paused.current || document.hidden) return;
      scrollToRaw(rawRef.current + 1, true);
    }, INTERVAL);

    return () => {
      window.clearTimeout(timeout);
      t.removeEventListener("scroll", onScroll);
      t.removeEventListener("scrollend", settle);
      window.removeEventListener("resize", onResize);
      slider.removeEventListener("mouseenter", pause);
      slider.removeEventListener("mouseleave", resume);
      slider.removeEventListener("focusin", pause);
      slider.removeEventListener("focusout", resume);
      window.clearInterval(timer);
      first.remove();
      last.remove();
    };
  }, [track, scrollToRaw, count]);

  const arrow =
    "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-opacity hover:bg-white md:flex md:opacity-0 md:group-hover/slider:opacity-100 focus-visible:opacity-100 group-focus-within/slider:opacity-100";

  return (
    <div ref={rootRef}>
      <button
        type="button"
        aria-label="Предыдущий слайд"
        onClick={() => step(-1)}
        className={`${arrow} left-3`}
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Следующий слайд"
        onClick={() => step(1)}
        className={`${arrow} right-3`}
      >
        <ChevronRight size={22} aria-hidden="true" />
      </button>
      <div className="absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5 md:bottom-3">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Перейти к слайду ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all ${
              i === active ? "w-6 bg-brand" : "w-2 bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
