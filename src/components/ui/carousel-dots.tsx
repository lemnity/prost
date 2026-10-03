"use client";

import { useEffect, useState } from "react";

type CarouselDotsProps = { trackId: string; count: number };

export function CarouselDots({ trackId, count }: CarouselDotsProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = document.getElementById(trackId);
    if (!track) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const cards = Array.from(track.children) as HTMLElement[];
      const left = track.scrollLeft;
      const atEnd = left + track.clientWidth >= track.scrollWidth - 2;
      let idx = cards.findIndex((c) => c.offsetLeft - cards[0].offsetLeft >= left - 2);
      if (idx < 0 || atEnd) idx = atEnd ? cards.length - 1 : 0;
      setActive(idx);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [trackId]);

  const go = (i: number) => {
    const track = document.getElementById(trackId);
    const card = track?.children[i] as HTMLElement | undefined;
    if (!track || !card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({
      left: card.offsetLeft - (track.children[0] as HTMLElement).offsetLeft,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <div className="mt-4 flex flex-wrap justify-center">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => go(i)}
          aria-label={`Перейти к карточке ${i + 1}`}
          aria-current={i === active ? "true" : undefined}
          className="flex h-6 min-w-6 items-center justify-center px-[2px]"
        >
          <span
            className={`h-1.5 rounded-full motion-safe:transition-all motion-safe:duration-200 ${i === active ? "w-[18px] bg-[#4A4A4A]" : "w-1.5 bg-[#D0D0D0]"}`}
          />
        </button>
      ))}
    </div>
  );
}
