"use client";

import { useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

const noop = () => () => {};

export type Tab = { id: string; label: string; content: ReactNode };

/** Вкладки (WAI-ARIA tabs). Без JS обе панели видны друг под другом. */
export function ProductTabs({ tabs }: { tabs: Tab[] }) {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const uid = useId();

  if (!hydrated) {
    return (
      <div className="space-y-8">
        {tabs.map((t) => (
          <section key={t.id} aria-labelledby={`${uid}-h-${t.id}`}>
            <h2 id={`${uid}-h-${t.id}`} className="mb-4 text-[20px] font-bold">
              {t.label}
            </h2>
            {t.content}
          </section>
        ))}
      </div>
    );
  }

  const focus = (i: number) => {
    const n = (i + tabs.length) % tabs.length;
    setActive(n);
    refs.current[n]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Информация о товаре" className="flex gap-6 border-b border-line">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${uid}-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls={`${uid}-panel-${t.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") focus(i + 1);
              else if (e.key === "ArrowLeft") focus(i - 1);
              else if (e.key === "Home") focus(0);
              else if (e.key === "End") focus(tabs.length - 1);
              else return;
              e.preventDefault();
            }}
            className={`-mb-px border-b-2 pb-3 text-[16px] font-semibold md:text-[18px] ${
              i === active ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.id}
          id={`${uid}-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${t.id}`}
          tabIndex={0}
          hidden={i !== active}
          className="pt-5 focus-visible:outline-offset-4"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
