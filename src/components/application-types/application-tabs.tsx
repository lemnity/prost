"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import type { Section } from "@/lib/application-types";
import { Sections } from "./blocks";

const TABS = [
  { id: "description", label: "Описание" },
  { id: "prices", label: "Прайс-лист" },
  { id: "recommendations", label: "Рекомендации" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const isTab = (v: string): v is TabId => TABS.some((t) => t.id === v);

/**
 * Без JS (ready=false) все разделы показаны подряд с заголовками;
 * после гидрации включается переключатель, активная вкладка хранится в hash.
 */
const EVT = "apt-tab-change";
const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  window.addEventListener(EVT, cb);
  return () => {
    window.removeEventListener("hashchange", cb);
    window.removeEventListener(EVT, cb);
  };
};
const getTab = (): TabId => {
  const h = window.location.hash.slice(1);
  return isTab(h) ? h : "description";
};
const noop = () => () => {};

export function ApplicationTabs({ sections }: { sections: Section[] }) {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const active = useSyncExternalStore(subscribe, getTab, () => "description" as TabId);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = useCallback((id: TabId, focus = false) => {
    window.history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new Event(EVT));
    if (focus) refs.current[id]?.focus();
  }, []);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = TABS.length - 1;
    if (n < 0) return;
    e.preventDefault();
    select(TABS[n].id, true);
  };

  return (
    <div>
      {ready ? (
        <div
          role="tablist"
          aria-label="Разделы о виде нанесения"
          className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0"
        >
          {TABS.map((t, i) => {
            const on = active === t.id;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  refs.current[t.id] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={on}
                aria-controls={`panel-${t.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => select(t.id)}
                onKeyDown={(e) => onKey(e, i)}
                className={`-mb-px h-12 shrink-0 border-b-2 px-4 text-[15px] font-semibold transition-colors md:px-6 ${
                  on ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      ) : null}
      {TABS.map((t) => {
        const secs = sections.filter((s) => s.tab === t.id);
        if (!secs.length) return null;
        return (
          <div
            key={t.id}
            role={ready ? "tabpanel" : undefined}
            id={`panel-${t.id}`}
            aria-labelledby={ready ? `tab-${t.id}` : undefined}
            hidden={ready && active !== t.id}
            className="pt-6 md:pt-8"
          >
            {ready ? null : <h2 className="mb-4 border-b border-line pb-2 text-[24px] font-bold">{t.label}</h2>}
            <Sections sections={secs} />
          </div>
        );
      })}
    </div>
  );
}
