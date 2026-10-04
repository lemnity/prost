"use client";

import { Minus, Plus } from "lucide-react";
import { setQty } from "@/lib/cart/store";

export function QtyStepper({ id, qty, title }: { id: string; qty: number; title: string }) {
  const btn =
    "grid size-9 shrink-0 place-items-center text-ink hover:text-brand disabled:text-faint disabled:hover:text-faint";
  return (
    <div
      role="group"
      aria-label={`Количество: ${title}`}
      className="inline-flex h-9 items-center rounded-lg border border-line bg-white"
    >
      <button type="button" aria-label="Уменьшить количество" disabled={qty <= 1} onClick={() => setQty(id, qty - 1)} className={btn}>
        <Minus size={14} aria-hidden="true" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label="Количество"
        value={qty}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
          if (n > 0) setQty(id, n);
        }}
        className="h-full w-12 min-w-0 bg-transparent text-center text-[13px] font-semibold tabular-nums text-ink outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
      />
      <button type="button" aria-label="Увеличить количество" disabled={qty >= 99999} onClick={() => setQty(id, qty + 1)} className={btn}>
        <Plus size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
