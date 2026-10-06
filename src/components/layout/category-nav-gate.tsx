"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// The quick-nav row is shown only on the home page.
// usePathname is known at prerender time, so the server HTML already omits it.
export function CategoryNavGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname !== "/") return null;
  return <>{children}</>;
}
