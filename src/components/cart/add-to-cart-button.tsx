"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
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
  oldPrice?: number;
  stock: number;
};

/** card — кнопка во всю ширину карточки; icon — компактная иконка; row — для строки списка. */
export type CartButtonVariant = "card" | "icon" | "row";

const WRAP: Record<CartButtonVariant, string> = {
  card: "mt-3",
  icon: "",
  row: "w-[148px]",
};

export function AddToCartButton({
  product,
  variant = "card",
}: {
  product: CartProduct;
  variant?: CartButtonVariant;
}) {
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
        className={`${WRAP[variant]} inline-flex h-9 items-center justify-center rounded-lg border border-brand bg-white px-3 font-semibold text-brand ${
          variant === "icon" ? "text-[12px]" : "text-[13px]"
        }`}
      >
        Запросить
      </Link>
    );
  }

  return (
    <>
      {status}
      {showStepper && line ? (
        <div
          ref={wrapRef}
          className={`${WRAP[variant]} ${variant === "icon" ? "basis-full" : ""} flex justify-center [&>div]:w-full [&_input]:flex-1`}
        >
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
              ...(product.oldPrice ? { oldPrice: product.oldPrice } : {}),
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
          aria-label={variant === "icon" ? (added ? "Добавлено в корзину" : "В корзину") : undefined}
          className={`${WRAP[variant]} inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand text-[13px] font-semibold text-white hover:bg-brand-hover ${
            variant === "icon" ? "size-9 shrink-0" : ""
          }`}
        >
          {variant === "icon" ? (
            added ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <ShoppingCart size={16} aria-hidden="true" />
            )
          ) : added ? (
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
