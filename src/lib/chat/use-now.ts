"use client";

import { useEffect, useState } from "react";

/** Текущее время; тикает, пока не наступит until (последнее отложенное сообщение) или пока active. */
export function useNow(until: number, active = false) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    if (!active && until <= Date.now()) return;
    const id = setInterval(() => {
      tick();
      if (!active && Date.now() >= until) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [until, active]);
  return now;
}
