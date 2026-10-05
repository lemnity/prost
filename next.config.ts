import path from "node:path";
import type { NextConfig } from "next";

// GitHub Pages build: static export under /prost. Regular builds are unchanged.
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? "/prost" : "";

const nextConfig: NextConfig = {
  ...(pages ? { output: "export", basePath, trailingSlash: true } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: {
    formats: ["image/avif", "image/webp"],
    // Фото товаров каталога (временный источник — prostyle.gifts).
    // Без поля search: допускаются любые query (?size=…).
    remotePatterns: [{ protocol: "https", hostname: "prostyle.gifts", pathname: "/content/**" }],
    ...(pages ? { unoptimized: true } : {}),
  },
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
