"use client";

import { useEffect, useState } from "react";
import { getUpcomingHolidays, type UpcomingHoliday } from "@/lib/holidays";

export function HolidayStatus({ initial }: { initial: UpcomingHoliday[] }) {
  // Первый клиентский рендер == серверный (initial посчитан при сборке);
  // реальное значение ставится в useEffect, затем пересчёт раз в час.
  const [list, setList] = useState<UpcomingHoliday[]>(initial);

  useEffect(() => {
    const tick = () => setList(getUpcomingHolidays(new Date(), 2));
    tick();
    const id = setInterval(tick, 3_600_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      role="group"
      aria-label={`Ближайшие праздники: ${list.map((h) => `${h.date} ${h.title}`).join(", ")}`}
      className="pointer-events-none absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] rounded-[8px] bg-white/95 px-2 py-1 text-ink shadow-sm"
    >
      <div aria-hidden="true">
        <div className="whitespace-nowrap text-[11px] leading-tight text-muted">
          Ближайшие праздники
        </div>
        {list.map((h, i) => (
          <div
            key={h.title}
            className={`mt-0.5 gap-1 text-xs leading-tight ${i === 0 ? "flex" : "hidden @[185px]:flex"}`}
          >
            <span className="shrink-0 font-bold">{h.date}</span>
            <span className="whitespace-nowrap">{h.short}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
