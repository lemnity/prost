"use client";

import { useEffect, useState } from "react";

export type Live = { price: number; oldPrice: number | null; stock: number; remote: number; deleted: boolean };

/** Живые цены/остатки склада по артикулам (после загрузки страницы; статика — до ответа). */
export function useLiveStock(skus: string[]): Record<string, Live> {
  const key = [...new Set(skus.map((s) => s.trim().toLowerCase()).filter(Boolean))].sort().join(",");
  const [live, setLive] = useState<Record<string, Live>>({});
  useEffect(() => {
    if (!key) return;
    let alive = true;
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/stock?sku=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : { items: {} }))
      .then((d: { items?: Record<string, Live> }) => alive && setLive(d.items ?? {}))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [key]);
  return live;
}
