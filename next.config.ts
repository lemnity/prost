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
  // Кэш страниц (ISR) — только в памяти (cacheMaxMemorySize, по умолчанию 50 МБ, вытеснение старых записей).
  // На диск не пишем: роботы обходят десятки тысяч товаров, и кэш на диске за сутки занял весь диск сервера.
  experimental: { isrFlushToDisk: false },
  // Фото gifts.ru на проде отдаёт nginx (/gifts-img/ с кэшем); для dev — та же подмена средствами Next.
  ...(pages ? {} : { rewrites: async () => [{ source: "/gifts-img/:path*", destination: "https://files.gifts.ru/reviewer/:path*" }] }),
  // Пути вложений вычисляются во время работы — трассировщик иначе тащит в сборку весь проект.
  outputFileTracingExcludes: { "*": ["./.next/**", "./out/**", "./docs/**", "./src/**", "./loading/**", "./scripts/**", "./*.md", "./.github/**"] },
};

export default nextConfig;
