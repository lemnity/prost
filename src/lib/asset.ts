// Prefix for local static assets. next/image (unoptimized export) and raw
// paths do not get basePath automatically; next/link does.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  return path.startsWith("/") ? `${BASE}${path}` : path;
}
