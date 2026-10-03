"use client";

import { useEffect, useState } from "react";
import { getUpcomingHoliday } from "@/lib/holidays";

function current() {
  const h = getUpcomingHoliday(new Date());
  return `${h.title}, ${h.label}`;
}

export function HolidayStatus() {
  // До гидрации — значение, посчитанное при сборке; пересчёт при монтировании и раз в час.
  const [text, setText] = useState(current);

  useEffect(() => {
    const tick = () => setText(current());
    tick();
    const id = setInterval(tick, 3_600_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] rounded-[8px] bg-white/95 px-2.5 py-1.5 text-ink shadow-sm">
      <div className="text-[11px] leading-tight text-muted">Впереди</div>
      <div
        className="text-xs font-semibold leading-tight sm:text-[13px] lg:text-xs"
        suppressHydrationWarning
      >
        {text}
      </div>
    </div>
  );
}
