"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Pins the navy panel to the top of the viewport. A zero-height sentinel sits
// at the panel's natural top; when it scrolls above the viewport the bar is
// "stuck" (data-stuck) and the logo mark / backdrop are revealed via CSS.
export function StickyBar({ children }: { children: ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) =>
      setStuck(!e.isIntersecting && e.boundingClientRect.top < 0),
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div
        ref={sentinel}
        aria-hidden
        className="pointer-events-none relative -top-2 h-px -mb-px"
      />
      <div
        data-stuck={stuck}
        className="group/bar sticky top-0 z-[45] -my-2 py-2 motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200 data-[stuck=true]:bg-white/95 data-[stuck=true]:shadow-[0_6px_16px_rgba(16,24,40,0.08)]"
      >
        {children}
      </div>
    </>
  );
}
