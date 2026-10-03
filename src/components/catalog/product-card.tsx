import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { formatPriceValue } from "@/lib/format";
import type { Product } from "@/lib/catalog/types";

export function ProductCard({ product }: { product: Product }) {
  const inStock = product.stock > 0;
  return (
    <article className="flex flex-col rounded-[10px] border border-line bg-white p-3">
      <div className="relative aspect-square">
        <Link href={product.url} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(min-width:1280px) 15vw, (min-width:1024px) 190px, 220px"
            className="object-contain"
          />
        </Link>
        <button
          type="button"
          aria-label="Добавить в избранное"
          className="absolute right-0 top-0 inline-flex size-8 items-center justify-center text-muted hover:text-brand"
        >
          <Heart size={18} aria-hidden="true" />
        </button>
        {product.isNew ? (
          <span className="absolute bottom-0 left-0 rounded-full bg-new-bg px-2 py-0.5 text-[10px] text-new-text">
            Новинка
          </span>
        ) : null}
      </div>
      <Link
        href={product.url}
        className="mt-2 line-clamp-2 min-h-[2lh] text-[13px] leading-snug text-ink hover:text-brand"
      >
        {product.title}
      </Link>
      <p className="mt-2 text-base font-bold">
        <span className="text-[13px] font-normal">от </span>
        {formatPriceValue(product.priceFrom)}
      </p>
      <button
        type="button"
        className={`mt-3 h-9 rounded-lg text-[13px] font-semibold ${
          inStock
            ? "bg-brand text-white hover:bg-brand-hover"
            : "border border-brand bg-white text-brand"
        }`}
      >
        {inStock ? "В корзину" : "Запросить"}
      </button>
    </article>
  );
}
