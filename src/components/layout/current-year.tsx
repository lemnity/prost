"use client";

import { useSyncExternalStore } from "react";

const buildYear = new Date().getFullYear();
const noop = () => () => {};

// Static hosting: the server snapshot is the build-time year, the client
// snapshot is the real current year (React re-renders after hydration).
export function CurrentYear() {
  const year = useSyncExternalStore(
    noop,
    () => new Date().getFullYear(),
    () => buildYear,
  );
  return <>{year}</>;
}
