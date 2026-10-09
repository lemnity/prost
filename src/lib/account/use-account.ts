"use client";

import { useSyncExternalStore } from "react";
import { getLoadedServerSnapshot, getLoadedSnapshot, getSessionServerSnapshot, getSessionSnapshot, subscribeAccount } from "./store";

/** Текущий кабинет или null (на сервере и при гидратации — всегда null). */
export function useSession() {
  return useSyncExternalStore(subscribeAccount, getSessionSnapshot, getSessionServerSnapshot);
}

/** true, когда сервер ответил, вошёл ли пользователь. */
export function useSessionLoaded() {
  return useSyncExternalStore(subscribeAccount, getLoadedSnapshot, getLoadedServerSnapshot);
}
