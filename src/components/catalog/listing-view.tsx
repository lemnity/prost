"use client";

import { useRef, useSyncExternalStore } from "react";
import { Grid3x3, LayoutGrid, List } from "lucide-react";

/** Вид выдачи: мелкая/крупная сетка или список. Выбор хранится в браузере и общий для всех разделов. */
export const VIEWS = [
  { id: "compact", label: "Мелкая сетка", Icon: Grid3x3 },
  { id: "grid", label: "Крупная сетка", Icon: LayoutGrid },
  { id: "list", label: "Списком", Icon: List },
] as const;
export type View = (typeof VIEWS)[number]["id"];

const KEY = "prostyle-catalog-view";
const EVENT = "prostyle-catalog-view";
const isView = (v: string | null): v is View => VIEWS.some((x) => x.id === v);

function read(): View {
  try {
    const v = localStorage.getItem(KEY);
    return isView(v) ? v : "grid";
  } catch {
    return "grid";
  }
}
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}
function store(v: View) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    // приватный режим — вид не запомнится
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useListingView(): View {
  return useSyncExternalStore(subscribe, read, () => "grid");
}

/** Переключатель вида (радиогруппа со стрелками). «Мелкая сетка» — только с планшета. */
export function ListingViewSwitch() {
  const value = useListingView();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (i: number, dir: number) => {
    for (let k = 1; k <= VIEWS.length; k++) {
      const n = (i + dir * k + VIEWS.length) % VIEWS.length;
      const el = refs.current[n];
      if (el && el.offsetParent !== null) {
        el.focus();
        store(VIEWS[n].id);
        return;
      }
    }
  };
  return (
    <div role="radiogroup" aria-label="Вид списка товаров" className="flex items-center gap-1.5">
      {VIEWS.map((v, i) => {
        const on = v.id === value;
        return (
          <button
            key={v.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={v.label}
            title={v.label}
            tabIndex={on ? 0 : -1}
            onClick={() => store(v.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") move(i, 1);
              else if (e.key === "ArrowLeft" || e.key === "ArrowUp") move(i, -1);
              else return;
              e.preventDefault();
            }}
            className={`grid size-10 place-items-center rounded-[10px] border transition-colors ${v.id === "compact" ? "max-md:hidden" : ""} ${
              on ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:text-brand"
            }`}
          >
            <v.Icon size={18} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
