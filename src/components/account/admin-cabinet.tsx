"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { asset } from "@/lib/asset";
import { api } from "@/lib/account/store";
import { formatPriceValue } from "@/lib/format";
import { useSession } from "@/lib/account/use-account";
import { OrdersSection } from "@/components/account/orders";
import { CartView } from "@/components/cart/cart-view";
import { AdminOrders, FILTERS, STATUS, type AdminOrder } from "@/components/admin/admin-orders";
import { BrandingInfo } from "@/components/admin/branding-info";

// В кабинете администратора вкладки «Заявки» и «Корзина» показывают данные всех клиентов, а не его собственные.

export function CabinetOrders() {
  const admin = useSession()?.role === "admin";
  if (!admin) return <OrdersSection />;
  return (
    <Suspense fallback={null}>
      <AdminOrders base="/account" />
    </Suspense>
  );
}

export function CabinetCart() {
  const admin = useSession()?.role === "admin";
  return admin ? <ClientsCart /> : <CartView embedded />;
}

const dt = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Что клиенты положили в корзину и оформили: позиции всех заявок с нанесением. */
function ClientsCart() {
  const [filter, setFilter] = useState("new");
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await api<{ orders: AdminOrder[] }>(`/api/admin/orders${filter ? `?status=${filter}` : ""}`, { cache: "no-store" });
    if (r.ok) {
      setOrders(r.data.orders);
      setError("");
    } else setError(r.error);
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- загрузка с сервера: setState после await
    void load();
  }, [load]);

  const lines = orders?.reduce((n, o) => n + o.items.length, 0) ?? 0;
  const qty = orders?.reduce((n, o) => n + o.items.reduce((m, i) => m + i.qty, 0), 0) ?? 0;
  const sum = orders?.reduce((n, o) => n + o.total, 0) ?? 0;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`h-9 rounded-full border px-4 text-[13px] font-medium ${filter === f.value ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-brand"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {error ? <p role="alert" className="mt-4 text-brand">{error}</p> : null}
      {!orders ? (
        <div aria-busy="true" className="mt-4 h-[300px] animate-pulse rounded-[14px] bg-surface motion-reduce:animate-none" />
      ) : !orders.length ? (
        <p className="mt-6 rounded-[14px] bg-surface p-8 text-center text-muted">Заявок нет</p>
      ) : (
        <>
          <p className="mt-4 text-[14px] text-muted">
            Заявок: <b className="text-ink">{orders.length}</b> · позиций: <b className="text-ink">{lines}</b> · штук: <b className="text-ink">{qty.toLocaleString("ru-RU")}</b> · на сумму{" "}
            <b className="text-ink">{formatPriceValue(sum)}</b>
          </p>
          <ul className="mt-4 grid gap-4">
            {orders.map((o) => (
              <li key={o.number} className="overflow-hidden rounded-[14px] border border-line bg-white">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-surface px-4 py-2.5 text-[13px]">
                  <Link href={`/account?order=${encodeURIComponent(o.number)}`} className="text-[14px] font-semibold hover:text-brand">
                    {o.number}
                  </Link>
                  <span className="text-muted">{dt(o.date)}</span>
                  <span className="min-w-0 truncate">{o.contact.company || o.contact.name}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${STATUS[o.status]?.cls ?? ""}`}>{STATUS[o.status]?.label ?? o.status}</span>
                  <span className="ml-auto font-semibold tabular-nums">{formatPriceValue(o.total)}</span>
                </div>
                <ul className="divide-y divide-line px-4">
                  {o.items.map((i) => (
                    <li key={i.id} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-start gap-3 py-3">
                      <span className="relative aspect-square overflow-hidden rounded-md bg-surface">
                        <Image src={asset(i.image)} alt="" fill sizes="48px" className="object-contain" unoptimized />
                      </span>
                      <span className="min-w-0 text-[13px]">
                        <a href={i.url} target="_blank" rel="noopener" className="line-clamp-2 font-medium hover:text-brand">{i.title}</a>
                        <span className="text-muted">
                          Арт. {i.sku} · {i.qty.toLocaleString("ru-RU")} шт × {formatPriceValue(i.price)}
                          {i.preorder ? " · под заказ" : ""}
                        </span>
                        {i.branding ? <BrandingInfo b={i.branding} /> : null}
                      </span>
                      <span className="text-[14px] font-semibold tabular-nums">{formatPriceValue(i.qty * i.price)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
