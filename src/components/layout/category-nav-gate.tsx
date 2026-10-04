"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// The quick-nav row is hidden on every catalog page (listings and products).
// usePathname is known at prerender time, so the server HTML already omits it.
export function CategoryNavGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/catalog" || pathname.startsWith("/catalog/")) return null;
  return <>{children}</>;
}
