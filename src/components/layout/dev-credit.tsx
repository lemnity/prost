"use client";

import { useRef } from "react";

const COLORS = ["#d02e31", "#ec5b3c", "#ff7a8a", "#f43f5e", "#ffb199"];
const HEARTS = 16;
const COOLDOWN = 700;
const HEART_SVG =
  '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.5 2.2 4.5 6 4.5c2.2 0 3.6 1.2 4.5 2.6.3.5.7.9 1.5.9s1.2-.4 1.5-.9c.9-1.4 2.3-2.6 4.5-2.6 3.8 0 5.6 4 4 7.2C19.5 16.4 12 21 12 21z"/></svg>';

/** «Разработка Lemnity.Digital» — при наведении салют из сердечек. */
export function DevCredit() {
  const wrap = useRef<HTMLSpanElement>(null);
  const last = useRef(0);

  function burst() {
    const el = wrap.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const now = performance.now();
    if (now - last.current < COOLDOWN) return;
    last.current = now;
    for (let i = 0; i < HEARTS; i++) {
      const h = document.createElement("span");
      h.innerHTML = HEART_SVG;
      h.setAttribute("aria-hidden", "true");
      const size = 10 + Math.random() * 10;
      Object.assign(h.style, {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: `${size}px`,
        height: `${size}px`,
        color: COLORS[i % COLORS.length],
        pointerEvents: "none",
        willChange: "transform, opacity",
      });
      el.appendChild(h);
      // Веер вверх: угол от −160° до −20°, дальность 40–110px, лёгкое «падение» в конце.
      const angle = ((-160 + Math.random() * 140) * Math.PI) / 180;
      const dist = 40 + Math.random() * 70;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      const rot = -40 + Math.random() * 80;
      h.animate(
        [
          { transform: "translate(-50%, -50%) scale(0.3)", opacity: 1 },
          { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(calc(-50% + ${x * 1.1}px), calc(-50% + ${y + 24}px)) scale(0.8) rotate(${rot * 1.5}deg)`, opacity: 0 },
        ],
        { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.3,1)" },
      ).onfinish = () => h.remove();
    }
  }

  return (
    <span ref={wrap} className="relative inline-flex">
      <span
        tabIndex={0}
        onPointerEnter={burst}
        onFocus={burst}
        className="cursor-default rounded text-muted transition-colors hover:text-brand focus-visible:text-brand"
      >
        Разработка <span className="font-semibold">Lemnity.Digital</span>
      </span>
    </span>
  );
}
