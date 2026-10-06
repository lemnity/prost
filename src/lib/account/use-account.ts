"use client";

import { useSyncExternalStore } from "react";
import { getSessionServerSnapshot, getSessionSnapshot, subscribeAccount } from "./store";

/** Текущий кабинет или null (на сервере и при гидратации — всегда null). */
export function useSession() {
  return useSyncExternalStore(subscribeAccount, getSessionSnapshot, getSessionServerSnapshot);
}
