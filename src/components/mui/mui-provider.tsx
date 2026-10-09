"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";

/** Тема MUI для клиентских компонентов (кэш стилей — AppRouterCacheProvider в layout). */
export function MuiProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
