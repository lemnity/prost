"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const FUSE_MS = 8000;
let fuse: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

function overlay() {
  return document.getElementById("page-loader");
}

function show() {
  const el = overlay();
  if (!el) return;
  clearTimeout(hideTimer);
  el.hidden = false;
  void el.offsetWidth; // restart the opacity transition
  el.setAttribute("data-state", "visible");
  el.setAttribute("data-nav", "1");
  document.body.setAttribute("aria-busy", "true");
  clearTimeout(fuse);
  fuse = setTimeout(hide, FUSE_MS);
}

function hide() {
  const el = overlay();
  clearTimeout(fuse);
  if (!el || el.getAttribute("data-nav") !== "1") return;
  el.removeAttribute("data-nav");
  el.setAttribute("data-state", "hiding");
  document.body.removeAttribute("aria-busy");
  hideTimer = setTimeout(() => {
    el.hidden = true;
  }, 250);
}

function Watcher() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    hide();
  }, [pathname, search]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      if (a.hasAttribute("download")) return;
      if (a.target && a.target !== "_self") return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search)
        return;
      show();
    }
    document.addEventListener("click", onClick, true);
    addEventListener("popstate", hide);
    return () => {
      document.removeEventListener("click", onClick, true);
      removeEventListener("popstate", hide);
    };
  }, []);

  return null;
}

export function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <Watcher />
    </Suspense>
  );
}
