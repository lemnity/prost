"use client";

import { useSyncExternalStore } from "react";
import {
  getCartServerSnapshot,
  getCartSnapshot,
  getPromoServerSnapshot,
  getPromoSnapshot,
  subscribeCart,
} from "./store";

export function useCart() {
  return useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);
}

const noop = () => () => {};
/** false на сервере и при гидратации, true на клиенте после. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

export function usePromo() {
  return useSyncExternalStore(subscribeCart, getPromoSnapshot, getPromoServerSnapshot);
}
