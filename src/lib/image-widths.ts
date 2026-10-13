/** Ширины, до которых ужимаются фото товаров (WebP через /api/img) — немного вариантов, чтобы кэш был компактным. */
export const IMAGE_WIDTHS = [96, 200, 320, 480, 640, 828, 1080, 1200];

export const imageWidth = (w: number) => IMAGE_WIDTHS.find((x) => x >= w) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
