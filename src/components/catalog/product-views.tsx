import Link from "next/link";
import { ProductImage } from "@/components/ui/product-image";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { asset } from "@/lib/asset";
import { formatPriceValue, formatQty } from "@/lib/format";
import type { ListingProduct } from "@/lib/catalog/types";

const cartProduct = (p: ListingProduct) => ({
  id: p.id,
  sku: p.sku,
  title: p.title,
  image: p.image,
  url: p.url,
  priceFrom: p.priceFrom,
  stock: p.stock,
});

function Price({ p, size }: { p: ListingProduct; size: "sm" | "md" }) {
  return (
    <p className={`font-bold leading-tight ${size === "sm" ? "text-[14px]" : "text-[16px]"}`}>
      <span className={p.oldPrice ? "text-brand" : undefined}>
        <span className="text-[12px] font-normal text-ink">от </span>
        {formatPriceValue(p.priceFrom)}
      </span>
      {p.oldPrice ? (
        <span className="ml-1.5 text-[12px] font-normal text-muted line-through">{formatPriceValue(p.oldPrice)}</span>
      ) : null}
    </p>
  );
}

/** «Мелкая сетка»: компактная карточка. */
export function ProductCardCompact({ product: p }: { product: ListingProduct }) {
  return (
    <article className="relative flex flex-col rounded-[10px] border border-line bg-white p-2">
      <div className="relative aspect-square">
        <Link href={p.url} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
          <ProductImage
            src={asset(p.image)}
            alt={p.title}
            sizes="(min-width:1280px) 170px, (min-width:768px) 22vw, 45vw"
            className="object-contain"
          />
        </Link>
        {p.isNew && !p.oldPrice ? (
          <span className="absolute bottom-0 left-0 rounded-full bg-new-bg px-1.5 py-0.5 text-[10px] text-new-text">
            Новинка
          </span>
        ) : null}
      </div>
      <Link
        href={p.url}
        className="mt-1.5 line-clamp-2 min-h-[2lh] text-[12px] leading-snug text-ink hover:text-brand"
      >
        {p.title}
      </Link>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 pt-1.5">
        <Price p={p} size="sm" />
        <AddToCartButton product={cartProduct(p)} variant="icon" />
      </div>
    </article>
  );
}

/** «Списком»: строка товара. */
export function ProductRow({ product: p }: { product: ListingProduct }) {
  const prints = p.prints.slice(0, 3);
  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-3 p-3 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center sm:gap-x-4">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
        <Link href={p.url} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
          <ProductImage src={asset(p.image)} alt={p.title} sizes="96px" fallback="mini" className="object-contain" />
        </Link>
      </div>
      <div className="min-w-0">
        <Link href={p.url} className="line-clamp-2 text-[14px] font-medium leading-snug text-ink hover:text-brand">
          {p.title}
        </Link>
        <p className="mt-1 text-[12px] text-muted">
          Арт. {p.sku}
          <span aria-hidden="true"> · </span>
          {p.stock > 0 ? `На складе: ${formatQty(p.stock)} шт.` : "Под заказ"}
        </p>
        {prints.length ? (
          <ul aria-label="Виды нанесения" className="mt-1.5 flex flex-wrap gap-1">
            {prints.map((x) => (
              <li key={x} className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted">
                {x}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:gap-2">
        <Price p={p} size="md" />
        <AddToCartButton product={cartProduct(p)} variant="row" />
      </div>
    </article>
  );
}
