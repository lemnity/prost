import { asset } from "@/lib/asset";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatPriceValue } from "@/lib/format";
import type { Product } from "@/lib/catalog/types";

export function ProductCard({ product }: { product: Product }) {
  const { oldPrice } = product;
  const discount = oldPrice
    ? Math.round((1 - product.priceFrom / oldPrice) * 100)
    : 0;
  return (
    <article className="relative flex flex-col rounded-[10px] border border-line bg-white p-3">
      <div className="relative aspect-square">
        <Link href={product.url} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
          <Image
            src={asset(product.image)}
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
        {oldPrice ? (
          <span className="absolute left-0 top-0 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">
            {`\u2212${discount}%`}
          </span>
        ) : null}
        {product.isNew && !oldPrice ? (
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
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-base font-bold">
        <span className={oldPrice ? "text-brand" : undefined}>
          <span className={`text-[13px] font-normal ${oldPrice ? "text-ink" : ""}`}>от </span>
          {formatPriceValue(product.priceFrom)}
        </span>
        {oldPrice ? (
          <span className="text-[13px] font-normal text-muted line-through">
            {formatPriceValue(oldPrice)}
          </span>
        ) : null}
      </p>
      <AddToCartButton
        product={{
          id: product.id,
          sku: product.sku,
          title: product.title,
          image: product.image,
          url: product.url,
          priceFrom: product.priceFrom,
          stock: product.stock,
        }}
      />
    </article>
  );
}
