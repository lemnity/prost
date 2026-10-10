"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { buttonClass } from "@/components/ui/button";
import { productsLabel } from "@/lib/format";
import type { Product } from "@/lib/catalog/types";
import type { ListRequest } from "@/app/api/catalog/list/route";

/**
 * Сетка товаров с кнопкой «Показать ещё»: следующая страница догружается под текущими.
 * Без JS кнопка — обычная ссылка на следующую страницу (её же видят поисковики).
 */
export function ProductGrid({
  initial,
  total,
  page,
  perPage,
  request,
  nextHref,
}: {
  initial: Product[];
  total: number;
  page: number;
  perPage: number;
  request: ListRequest;
  nextHref: string;
}) {
  const [items, setItems] = useState(initial);
  const [current, setCurrent] = useState(page);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const shown = (page - 1) * perPage + items.length;
  const left = Math.max(0, total - shown);

  async function more(e: React.MouseEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/catalog/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...request, page: current + 1 }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { items: Product[] };
      setItems((all) => {
        const seen = new Set(all.map((p) => p.id));
        return [...all, ...data.items.filter((p) => !seen.has(p.id))];
      });
      setCurrent((n) => n + 1);
    } catch {
      setError("Не удалось загрузить — попробуйте ещё раз");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 2xl:grid-cols-4">
        {items.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      {left > 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2">
          <Link href={nextHref} onClick={more} data-no-loader aria-busy={busy} className={`${buttonClass({ variant: "outline", size: "lg", px: "px-10" })} min-w-[260px]`}>
            {busy ? "Загружаем…" : `Показать ещё ${Math.min(perPage, left)}`}
          </Link>
          <p className="text-[13px] text-muted">
            Показано {shown.toLocaleString("ru-RU")} из {productsLabel(total)}
          </p>
          {error ? <p role="alert" className="text-[13px] text-brand">{error}</p> : null}
        </div>
      ) : null}
    </>
  );
}
