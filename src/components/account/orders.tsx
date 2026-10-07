"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, Check, ChevronDown, MessageCircle, Package, RotateCcw } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { asset } from "@/lib/asset";
import { formatPriceValue } from "@/lib/format";
import { plural } from "@/lib/plural";
import { site } from "@/content/site";
import { addToCart, cartCount } from "@/lib/cart/store";
import { greetName, isCurrentOrder, setOrderStatus, type OrderStatus, type SavedOrder } from "@/lib/account/store";
import { useSession } from "@/lib/account/use-account";
import { useChats } from "@/lib/chat/use-chats";

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

const STATUS: Record<OrderStatus | "archive", { label: string; cls: string }> = {
  new: { label: "Отправлена менеджеру", cls: "bg-new-bg text-new-text" },
  done: { label: "Выполнена", cls: "bg-surface text-ink" },
  cancelled: { label: "Отменена", cls: "bg-brand-soft text-brand" },
  archive: { label: "В архиве", cls: "bg-surface text-muted" },
};

function repeat(o: SavedOrder) {
  o.items.forEach(({ qty, ...item }) => addToCart(item, qty));
}

export function OrderCard({ order: o, current, open: initial = false }: { order: SavedOrder; current: boolean; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  const [done, setDone] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const hasChat = !!useChats()[o.number];
  const n = cartCount(o.items);
  const id = `order-${o.number}`;
  const status = STATUS[current ? "new" : o.status && o.status !== "new" ? o.status : "archive"];
  return (
    <article className="rounded-[14px] border border-line bg-white">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 md:p-5">
        <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
          <h3 className="text-[16px] font-semibold">Заявка № {o.number}</h3>
          <p className="mt-0.5 text-[13px] text-muted">
            {formatDate(o.date)} · {n} шт. · {o.delivery}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${status.cls}`}>{status.label}</span>
        <p className="text-[18px] font-bold tabular-nums">от {formatPriceValue(o.total)}</p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 items-center gap-1 text-[13px] font-medium text-muted hover:text-brand"
        >
          {open ? "Свернуть" : "Подробнее"}
          <ChevronDown size={16} aria-hidden="true" className={`motion-safe:transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      <div id={id} hidden={!open} className="border-t border-line p-4 md:p-5">
        <ul className="grid gap-3">
          {o.items.map((i) => (
            <li key={i.id} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3">
              <span className="relative aspect-square overflow-hidden rounded-md bg-surface">
                <ProductImage src={asset(i.image)} alt="" sizes="48px" fallback="mini" className="object-contain" />
              </span>
              <span className="min-w-0 text-[13px] leading-snug">
                <Link href={i.url} className="line-clamp-2 text-ink hover:text-brand">{i.title}</Link>
                <span className="text-muted">Арт. {i.sku} · {i.qty} шт × {formatPriceValue(i.price)}</span>
              </span>
              <span className="text-[14px] font-semibold tabular-nums">{formatPriceValue(i.qty * i.price)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid gap-1 text-[13px] sm:grid-cols-2">
          <div><dt className="inline text-muted">Получение: </dt><dd className="inline">{o.delivery}</dd></div>
          <div><dt className="inline text-muted">Оплата: </dt><dd className="inline">{o.payment}</dd></div>
          {o.address ? <div className="sm:col-span-2"><dt className="inline text-muted">Адрес: </dt><dd className="inline">{o.address}</dd></div> : null}
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => { repeat(o); setDone(true); }} className={buttonClass()}>
            {done ? <Check size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}
            {done ? "Добавлено в корзину" : "Повторить заказ"}
          </button>
          {done ? <Link href="/account/cart" className={buttonClass({ variant: "outline" })}>Перейти в корзину</Link> : null}
          {hasChat ? (
            <Link href={`/account/chat?order=${encodeURIComponent(o.number)}`} className={buttonClass({ variant: "outline" })}>
              <MessageCircle size={16} aria-hidden="true" />
              Чат по заявке
            </Link>
          ) : null}
          {current ? (
            <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
              {confirm ? (
                <>
                  <span className="text-[13px] text-muted">Отменить заявку?</span>
                  <button type="button" onClick={() => setOrderStatus(o.number, "cancelled")} className={buttonClass({ size: "sm" })}>Да, отменить</button>
                  <button type="button" onClick={() => setConfirm(false)} className={buttonClass({ variant: "outline", size: "sm" })}>Нет</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setOrderStatus(o.number, "done")} className="text-[13px] font-medium text-muted underline hover:text-brand">
                    Заказ получен
                  </button>
                  <button type="button" onClick={() => setConfirm(true)} className="text-[13px] font-medium text-muted underline hover:text-brand">
                    Отменить заявку
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
        {confirm ? (
          <p className="mt-2 text-[12px] text-muted">
            Заявка отметится отменённой в кабинете. Если менеджер уже работает с ней, предупредите его по телефону {site.phone.label}.
          </p>
        ) : null}
        <p role="status" className="sr-only">{done ? "Товары заказа добавлены в корзину" : ""}</p>
      </div>
    </article>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] bg-surface px-5 py-12 text-center">
      <Package size={36} strokeWidth={1.5} aria-hidden="true" className="text-brand" />
      <h3 className="mt-4 text-[20px] font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted">{text}</p>
      <Link href="/catalog" className={`${buttonClass({ size: "lg", px: "px-8" })} mt-6`}>Перейти в каталог</Link>
    </div>
  );
}

export function OrdersSection() {
  const s = useSession();
  const [now] = useState(() => Date.now());
  const [tab, setTab] = useState<"current" | "history">("current");
  if (!s) return null;
  const current = s.orders.filter((o) => isCurrentOrder(o, now));
  const history = s.orders.filter((o) => !isCurrentOrder(o, now));
  const list = tab === "current" ? current : history;
  const noRequisites = !s.profile.company || !s.profile.inn;
  const tabCls = (on: boolean) =>
    `inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-[14px] font-semibold ${on ? "bg-ink text-white" : "bg-surface text-ink hover:text-brand"}`;

  return (
    <div className="grid gap-5">
      <p className="text-[17px]">
        Здравствуйте, <strong>{greetName(s.profile)}</strong>!
      </p>
      {noRequisites ? (
        <div className="flex flex-col gap-3 rounded-[14px] bg-brand-soft p-4 sm:flex-row sm:items-center">
          <Building2 size={26} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand" />
          <p className="text-[14px] sm:flex-1">
            <span className="font-semibold">Добавьте компанию и ИНН</span>
            <span className="text-muted"> — они подставятся в заявку для выставления счёта.</span>
          </p>
          <Link href="/account/profile" className="text-[14px] font-semibold text-brand hover:text-brand-hover">Заполнить</Link>
        </div>
      ) : null}
      <div role="tablist" aria-label="Заявки" className="flex flex-wrap gap-2">
        <button type="button" role="tab" id="tab-current" aria-selected={tab === "current"} aria-controls="orders-panel" onClick={() => setTab("current")} className={tabCls(tab === "current")}>
          Текущие <span className="tabular-nums opacity-70">{current.length}</span>
        </button>
        <button type="button" role="tab" id="tab-history" aria-selected={tab === "history"} aria-controls="orders-panel" onClick={() => setTab("history")} className={tabCls(tab === "history")}>
          История <span className="tabular-nums opacity-70">{history.length}</span>
        </button>
      </div>
      <div id="orders-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {list.length ? (
          <ul className="grid gap-3">
            {list.map((o, i) => (
              <li key={o.number}>
                <OrderCard order={o} current={tab === "current"} open={tab === "current" && i === 0} />
              </li>
            ))}
          </ul>
        ) : tab === "current" ? (
          <Empty title="Текущих заявок нет" text="Оформленные заявки появятся здесь — менеджер свяжется с вами после отправки." />
        ) : (
          <Empty title="История пуста" text={`Выполненные и отменённые заявки, а также заявки старше 60 ${plural("d", 60)}, попадут сюда.`} />
        )}
      </div>
    </div>
  );
}
