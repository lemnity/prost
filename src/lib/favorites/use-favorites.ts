"use client";

import { useSyncExternalStore } from "react";
import { getFavoritesServerSnapshot, getFavoritesSnapshot, subscribeFavorites } from "./store";

export function useFavorites() {
  return useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, getFavoritesServerSnapshot);
}
