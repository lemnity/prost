"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { addToCart } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/use-cart";
import type { Product } from "@/lib/catalog/types";
import { QtyStepper } from "./qty-stepper";

export function AddToCartButton({ product }: { product: Product }) {
  const list = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (product.stock <= 0) {
    return (
      <Link
        href="/contact-us#callback"
        className="mt-3 inline-flex h-9 items-center justify-center rounded-lg border border-brand bg-white text-[13px] font-semibold text-brand"
      >
        Запросить
      </Link>
    );
  }
  const line = list.find((i) => i.id === product.id);

  if (line && !added) {
    return (
      <div className="mt-3 flex justify-center [&>div]:w-full [&_input]:flex-1">
        <QtyStepper id={product.id} qty={line.qty} title={product.title} />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        addToCart({
          id: product.id,
          sku: product.sku,
          title: product.title,
          image: product.image,
          url: product.url,
          price: product.priceFrom,
        });
        setAdded(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setAdded(false), 1200);
      }}
      className="mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand text-[13px] font-semibold text-white hover:bg-brand-hover"
    >
      {added ? (
        <>
          Добавлено <Check size={15} aria-hidden="true" />
        </>
      ) : (
        "В корзину"
      )}
    </button>
  );
}
