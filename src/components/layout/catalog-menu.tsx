"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import type { MenuData } from "@/lib/catalog/menu";
import { getSaleRemaining, type SaleRemaining } from "@/lib/sale";
import { CatalogPanes, CatalogSheetContent } from "./catalog-menu-content";

const btnClass =
  "grid size-12 shrink-0 place-items-center rounded-[10px] bg-white/10 text-white hover:bg-white/20 md:flex md:w-[240px] md:items-center md:justify-between md:px-5";

const noopSubscribe = () => () => {};
const MQ = "(min-width: 1024px)";
const subscribeDesktop = (cb: () => void) => {
  const m = window.matchMedia(MQ);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const getDesktop = () => window.matchMedia(MQ).matches;

// Подкатегории и «Товар дня» — статический JSON, грузится один раз:
// в простое после загрузки страницы или при первом наведении/фокусе.
const MENU_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/catalog-menu.json`;
let menuPromise: Promise<MenuData> | null = null;
function loadMenu(): Promise<MenuData> {
  menuPromise ??= fetch(MENU_URL)
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<MenuData>;
    })
    .catch((e) => {
      menuPromise = null;
      throw e;
    });
  return menuPromise;
}

export function CatalogMenu({ rows }: { rows: ReactNode }) {
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const desk = useSyncExternalStore(subscribeDesktop, getDesktop, () => true);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [menu, setMenu] = useState<{ data: MenuData; dayLeft: SaleRemaining } | null>(null);

  const ensureMenu = useCallback(() => {
    loadMenu()
      .then((data) => setMenu((m) => m ?? { data, dayLeft: getSaleRemaining(new Date(), "day") }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const idle = () => ensureMenu();
    const start = () => {
      if ("requestIdleCallback" in window) {
        const id = window.requestIdleCallback(idle, { timeout: 4000 });
        return () => window.cancelIdleCallback(id);
      }
      const id = setTimeout(idle, 1500);
      return () => clearTimeout(id);
    };
    if (document.readyState === "complete") return start();
    let cancel: (() => void) | undefined;
    const onLoad = () => (cancel = start());
    window.addEventListener("load", onLoad, { once: true });
    return () => {
      window.removeEventListener("load", onLoad);
      cancel?.();
    };
  }, [ensureMenu]);

  const close = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);

  // Active row state is applied to the server-rendered rows; panes are
  // rendered on the client from the menu JSON.
  useEffect(() => {
    const root = panelRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>("[data-row]").forEach((el) => {
      const on = Number(el.dataset.row) === active;
      el.dataset.active = String(on);
    });
  }, [active, open]);

  // Fluid height: panel always ends 16px above the window bottom (computed on
  // open and on resize / header size change; page scroll is locked meanwhile). Scale is
  // measured (rect / offsetHeight) so it matches whatever zoom the browser
  // applies; CSS --menu-max-h (uses --zoom) is only the SSR/pre-measure fallback.
  // The 200px floor only matters for windows shorter than ~450px.
  useEffect(() => {
    const el = panelRef.current;
    if (!open || !desk || !el) return;
    let raf = 0;
    const fit = () => {
      el.style.removeProperty("--menu-max-h");
      const r = el.getBoundingClientRect();
      const scale = (el.offsetHeight ? r.height / el.offsetHeight : 1) || 1;
      const h = (window.innerHeight - r.top - 16) / scale;
      el.style.setProperty("--menu-max-h", `${Math.max(200, Math.floor(h))}px`);
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fit);
    };
    fit();
    const ro = new ResizeObserver(schedule);
    ro.observe(el.closest("header") ?? document.body);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [open, desk]);

  // Focus on open only (not on breakpoint changes).
  useEffect(() => {
    if (!open) return;
    if (getDesktop())
      panelRef.current
        ?.querySelector<HTMLElement>("[data-row][data-active=true]")
        ?.focus();
    else sheetRef.current?.querySelector<HTMLElement>("button")?.focus();
  }, [open]);

  // Lock page scroll while the catalog is open (sheet and desktop panel);
  // the gutter stays reserved so the layout does not shift.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = document.body.style.overflow;
    const prevGutter = root.style.scrollbarGutter;
    root.style.scrollbarGutter = "stable";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      root.style.scrollbarGutter = prevGutter;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (
        btnRef.current?.contains(t) ||
        panelRef.current?.contains(t) ||
        sheetRef.current?.contains(t)
      )
        return;
      close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      clearTimeout(timer.current);
    };
  }, [open, close]);

  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const items = Array.from(
      sheetRef.current?.querySelectorAll<HTMLElement>(
        "button, a[href], summary",
      ) ?? [],
    ).filter((el) => el.checkVisibility());
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const cur = document.activeElement;
    if (e.shiftKey && (cur === first || !sheetRef.current?.contains(cur))) {
      e.preventDefault();
      last.focus();
    } else if (
      !e.shiftKey &&
      (cur === last || !sheetRef.current?.contains(cur))
    ) {
      e.preventDefault();
      first.focus();
    }
  };

  const rowOf = (t: EventTarget | null) =>
    (t as HTMLElement | null)?.closest<HTMLElement>("[data-row]");

  const onKeyDown = (e: React.KeyboardEvent) => {
    const root = panelRef.current;
    if (!root) return;
    const row = rowOf(e.target);
    const sub = (e.target as HTMLElement).closest<HTMLElement>("[data-sub]");
    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-row]"));
    if (row && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const i = Number(row.dataset.row);
      const n =
        (i + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
      rows[n].focus();
    } else if (row && e.key === "ArrowRight") {
      e.preventDefault();
      root
        .querySelector<HTMLElement>(
          `[data-pane="${row.dataset.row}"] [data-sub]`,
        )
        ?.focus();
    } else if (sub && e.key === "ArrowLeft") {
      e.preventDefault();
      rows[active]?.focus();
    } else if (sub && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const subs = Array.from(
        root.querySelectorAll<HTMLElement>(
          `[data-pane="${active}"] [data-sub]`,
        ),
      );
      const i = subs.indexOf(sub);
      subs[
        (i + (e.key === "ArrowDown" ? 1 : -1) + subs.length) % subs.length
      ]?.focus();
    }
  };

  const activate = (t: EventTarget | null, delay: number) => {
    const row = rowOf(t);
    if (!row) return;
    clearTimeout(timer.current);
    const i = Number(row.dataset.row);
    if (delay) timer.current = setTimeout(() => setActive(i), delay);
    else setActive(i);
  };

  const label = (
    <>
      <span className="flex items-center gap-3 text-[15px] font-bold uppercase tracking-wide">
        {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        <span className="sr-only md:not-sr-only">Каталог</span>
      </span>
      <ChevronDown
        size={18}
        aria-hidden
        className={`hidden text-white/70 transition-transform md:block ${open ? "rotate-180" : ""}`}
      />
    </>
  );

  return (
    <>
      {!hydrated ? (
        <Link href="/catalog" aria-label="Каталог" className={btnClass}>
          {label}
        </Link>
      ) : (
        <button
          ref={btnRef}
          type="button"
          aria-label="Каталог"
          aria-expanded={open}
          aria-controls={desk ? "catalog-menu" : "catalog-sheet"}
          onClick={() => {
            ensureMenu();
            setOpen((o) => !o);
          }}
          onPointerEnter={ensureMenu}
          onFocus={ensureMenu}
          className={btnClass}
        >
          {label}
        </button>
      )}
      {open &&
        createPortal(
          <div
            aria-hidden
            onClick={() => close()}
            className="fixed inset-0 z-40 hidden bg-black/30 lg:block"
          />,
          document.body,
        )}
      <div
        id="catalog-menu"
        ref={panelRef}
        hidden={!open}
        onKeyDown={onKeyDown}
        onMouseOver={(e) => activate(e.target, 80)}
        onMouseLeave={() => clearTimeout(timer.current)}
        onFocus={(e) => activate(e.target, 0)}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) close();
        }}
        className="absolute left-2 right-0 top-full z-50 mt-2 hidden max-h-(--menu-max-h) overflow-hidden rounded-[16px] bg-white text-ink shadow-xl lg:[&:not([hidden])]:block [&_a:focus-visible]:-outline-offset-2 [&_a:focus-visible]:outline-brand!"
      >
        <nav aria-label="Каталог" className="flex" data-catalog-panel>
          {rows}
          <CatalogPanes data={menu?.data ?? null} active={active} dayLeft={menu?.dayLeft ?? null} />
        </nav>
      </div>
      <div
        id="catalog-sheet"
        ref={sheetRef}
        onKeyDown={trapTab}
        role="dialog"
        aria-modal="true"
        aria-label="Каталог"
        hidden={!open}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) close();
        }}
        className="fixed inset-0 z-[60] flex-col bg-white text-ink lg:hidden! [&:not([hidden])]:flex [&_a:focus-visible]:outline-brand! [&_summary:focus-visible]:outline-brand!"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <span className="text-lg font-bold">Каталог</span>
          <button
            type="button"
            aria-label="Закрыть каталог"
            onClick={() => close(true)}
            className="grid size-12 place-items-center rounded-[10px] text-ink hover:bg-surface"
          >
            <X size={24} aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {open ? <CatalogSheetContent data={menu?.data ?? null} /> : null}
        </div>
      </div>
    </>
  );
}
