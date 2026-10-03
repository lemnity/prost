"use client";

import { useEffect, useState } from "react";
import { getUpcomingHoliday } from "@/lib/holidays";

type Holiday = { title: string; label: string };

function current(): Holiday {
  const h = getUpcomingHoliday(new Date());
  return { title: h.title, label: h.label };
}

export function HolidayStatus({ initial }: { initial: Holiday }) {
  // Первый клиентский рендер == серверный (initial посчитан при сборке);
  // реальное значение ставится в useEffect, затем пересчёт раз в час.
  const [holiday, setHoliday] = useState<Holiday>(initial);

  useEffect(() => {
    const tick = () => setHoliday(current());
    tick();
    const id = setInterval(tick, 3_600_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] rounded-[8px] bg-white/95 px-2 py-1 text-ink shadow-sm sm:px-2.5 sm:py-1.5">
      <div className="whitespace-nowrap text-[11px] leading-tight text-muted">
        <span className="lg:hidden">Впереди · </span>
        <span className="hidden lg:inline">До </span>
        {holiday.label}
      </div>
      <div
        title={holiday.title}
        className="line-clamp-2 text-xs font-semibold leading-tight sm:text-[13px] lg:line-clamp-1 lg:text-[11px] xl:text-xs"
       
      >
        {holiday.title}
      </div>
    </div>
  );
}
