"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { addToCart } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/use-cart";
import { QtyStepper } from "./qty-stepper";

export type CartProduct = {
  id: string;
  sku: string;
  title: string;
  image: string;
  url: string;
  priceFrom: number;
  stock: number;
};

export function AddToCartButton({ product }: { product: CartProduct }) {
  const list = useCart();
  const [added, setAdded] = useState(false);
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const focusPlus = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);

  const line = list.find((i) => i.id === product.id);
  const showStepper = !!line && !added;
  useEffect(() => {
    if (showStepper && focusPlus.current) {
      focusPlus.current = false;
      wrapRef.current?.querySelector<HTMLElement>("[data-plus]")?.focus();
    }
  }, [showStepper]);

  const status = (
    <span role="status" className="sr-only">
      {announce}
    </span>
  );

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

  return (
    <>
      {status}
      {showStepper && line ? (
        <div ref={wrapRef} className="mt-3 flex justify-center [&>div]:w-full [&_input]:flex-1">
          <QtyStepper id={product.id} qty={line.qty} title={product.title} />
        </div>
      ) : (
        <button
          ref={btnRef}
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
            setAnnounce("");
            setTimeout(() => setAnnounce("Добавлено в корзину"), 50);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => {
              focusPlus.current = document.activeElement === btnRef.current;
              setAdded(false);
            }, 1200);
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
      )}
    </>
  );
}
