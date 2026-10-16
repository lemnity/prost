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
import { ShippingEditor } from "@/components/admin/shipping-editor";
import { DeliverySection } from "@/components/account/delivery-form";
import { SHIP_STAGES, stageLabel, type ShipStage } from "@/lib/shipping";

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

export function CabinetDelivery() {
  const admin = useSession()?.role === "admin";
  return admin ? <ShippingBoard /> : <DeliverySection />;
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

const STAGE_FILTERS: { value: ShipStage | "" | "none"; label: string }[] = [
  { value: "", label: "Все" },
  { value: "none", label: "Не начата" },
  ...SHIP_STAGES.map((s) => ({ value: s.key, label: s.label })),
];

/** Доставка всех заявок: этап, перевозчик и трек-номер правятся прямо в списке. Отменённые не показываем. */
function ShippingBoard() {
  const [filter, setFilter] = useState<ShipStage | "" | "none">("");
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await api<{ orders: AdminOrder[] }>("/api/admin/orders", { cache: "no-store" });
    if (r.ok) {
      setOrders(r.data.orders.filter((o) => o.status !== "cancelled"));
      setError("");
    } else setError(r.error);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- загрузка с сервера: setState после await
    void load();
  }, [load]);

  const list = orders?.filter((o) => (filter === "" ? true : filter === "none" ? !o.shipping : o.shipping?.stage === filter)) ?? null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {STAGE_FILTERS.map((f) => {
          const n = orders?.filter((o) => (f.value === "" ? true : f.value === "none" ? !o.shipping : o.shipping?.stage === f.value)).length;
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`h-9 rounded-full border px-4 text-[13px] font-medium ${filter === f.value ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-brand"}`}
            >
              {f.label}
              {n != null ? <span className="ml-1.5 tabular-nums opacity-60">{n}</span> : null}
            </button>
          );
        })}
      </div>
      {error ? <p role="alert" className="mt-4 text-brand">{error}</p> : null}
      {!list ? (
        <div aria-busy="true" className="mt-4 h-[300px] animate-pulse rounded-[14px] bg-surface motion-reduce:animate-none" />
      ) : !list.length ? (
        <p className="mt-6 rounded-[14px] bg-surface p-8 text-center text-muted">Заявок нет</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {list.map((o) => (
            <li key={o.number} className="rounded-[14px] border border-line bg-white p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                <Link href={`/account?order=${encodeURIComponent(o.number)}`} className="text-[14px] font-semibold hover:text-brand">
                  {o.number}
                </Link>
                <span className="text-muted">{dt(o.date)}</span>
                <span className="min-w-0 truncate">{o.contact.company || o.contact.name}</span>
                <a href={`tel:${o.contact.phone.replace(/[^\d+]/g, "")}`} className="text-muted hover:text-brand">{o.contact.phone}</a>
                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[12px] font-medium ${o.shipping ? "bg-brand-soft text-brand" : "bg-surface text-muted"}`}>
                  {o.shipping ? stageLabel(o.shipping.stage) : "Не начата"}
                </span>
              </div>
              <p className="mt-1.5 text-[13px]">
                <span className="text-muted">Получение:</span> {o.delivery}
                {o.address ? ` — ${o.address}` : ""}
                <span className="text-muted"> · {o.items.reduce((n, i) => n + i.qty, 0).toLocaleString("ru-RU")} шт. · {formatPriceValue(o.total)}</span>
              </p>
              <div className="mt-3 border-t border-line pt-3">
                <ShippingEditor
                  key={`${o.number}-${o.shipping?.updatedAt ?? ""}`}
                  number={o.number}
                  value={o.shipping}
                  onSaved={(shipping) => setOrders((l) => l?.map((x) => (x.number === o.number ? { ...x, shipping } : x)) ?? l)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
