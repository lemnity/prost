// Загрузчик next/image: фото складов (JPG) → WebP нужной ширины через /api/img (кэш nginx).
// Свои картинки сайта (уже WebP/SVG) отдаются как есть.
import { imageWidth } from "./image-widths";

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  const remote = /^https?:\/\//.test(src) || src.startsWith("/gifts-img/");
  if (!remote) return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
  return `/api/img?w=${imageWidth(width)}&src=${encodeURIComponent(src)}`;
}
