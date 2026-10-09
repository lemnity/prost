import path from "node:path";
import type { NextConfig } from "next";

// Боевой сервер (prostyle.agency): автономная сборка (output: "standalone") — server.js + API.
// GITHUB_PAGES=true — старая статическая витрина под /prost (без API: кабинет и заявки там не работают).
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? "/prost" : "";

const nextConfig: NextConfig = {
  // Боевая сборка — в отдельную папку (scripts/deploy.sh), чтобы не мешать запущенному dev-серверу.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  ...(pages ? { output: "export", basePath, trailingSlash: true } : { output: "standalone" }),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: {
    formats: ["image/avif", "image/webp"],
    // Фото товаров каталога (временный источник — prostyle.gifts).
    // Без поля search: допускаются любые query (?size=…).
    remotePatterns: [{ protocol: "https", hostname: "prostyle.gifts", pathname: "/content/**" }],
    // Без серверной оптимизации: слабый сервер, картинки уже в webp/с CDN-источника.
    unoptimized: true,
  },
  turbopack: { root: path.resolve(__dirname) },
  // Пути вложений вычисляются во время работы — трассировщик иначе тащит в сборку весь проект.
  outputFileTracingExcludes: { "*": ["./.next/**", "./out/**", "./docs/**", "./src/**", "./loading/**", "./scripts/**", "./*.md", "./.github/**"] },
};

export default nextConfig;
