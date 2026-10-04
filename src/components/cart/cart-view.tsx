"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { asset } from "@/lib/asset";
import { formatPriceValue } from "@/lib/format";
import { site } from "@/content/site";
import { MIN_ORDER, cartCount, cartTotal, clearCart, removeFromCart, type CartItem } from "@/lib/cart/store";
import { useCart, useHydrated } from "@/lib/cart/use-cart";
import { QtyStepper } from "./qty-stepper";

const field =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3.5 py-3 text-[15px] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand";
const btnPrimary =
  "inline-flex h-[52px] items-center justify-center rounded-lg bg-brand px-8 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-faint disabled:hover:bg-faint";
const btnOutline =
  "inline-flex h-12 items-center justify-center rounded-lg border border-brand bg-white px-6 text-[15px] font-semibold text-brand hover:bg-brand hover:text-white";

export function CartView() {
  const items = useCart();
  const hydrated = useHydrated();
  const pendingFocus = useRef<{ id: string | null } | null>(null);

  useEffect(() => {
    const p = pendingFocus.current;
    if (!p) return;
    pendingFocus.current = null;
    const target = p.id
      ? Array.from(document.querySelectorAll<HTMLElement>(`[data-remove="${CSS.escape(p.id)}"]`)).find((el) => el.offsetParent !== null)
      : null;
    (target ?? document.getElementById("cart-heading"))?.focus();
  }, [items]);

  function remove(id: string) {
    const idx = items.findIndex((i) => i.id === id);
    pendingFocus.current = { id: items[idx + 1]?.id ?? items[idx - 1]?.id ?? null };
    removeFromCart(id);
  }

  if (!hydrated) {
    return (
      <section aria-label="Корзина загружается" aria-busy="true" className="py-6 md:py-8">
        <Container className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          <div className="min-h-[300px] animate-pulse rounded-[10px] bg-surface motion-reduce:animate-none" />
          <div className="hidden min-h-[220px] animate-pulse rounded-[14px] bg-surface motion-reduce:animate-none lg:block" />
        </Container>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section aria-label="Пустая корзина" className="py-8 md:py-10">
        <Container>
          <div className="flex flex-col items-center rounded-[14px] bg-surface px-5 py-12 text-center md:py-16">
            <ShoppingCart size={40} strokeWidth={1.5} aria-hidden="true" className="text-brand" />
            <h2 id="cart-heading" tabIndex={-1} className="mt-4 text-[22px] font-bold outline-none md:text-[26px]">Корзина пуста</h2>
            <p className="mt-2 max-w-md text-sm text-muted">
              Добавьте товары из каталога, чтобы оформить заказ.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/catalog" className={btnPrimary}>Перейти в каталог</Link>
              <Link href="/#new-products-title" className={btnOutline}>Новинки</Link>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section aria-label="Состав заказа" className="py-6 md:py-8">
      <Container className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 id="cart-heading" tabIndex={-1} className="sr-only">Состав заказа</h2>
          <ul className="grid gap-3">
            {items.map((i) => (
              <li
                key={i.id}
                className="grid grid-cols-[88px_1fr] gap-x-4 gap-y-3 rounded-[10px] border border-line bg-white p-3 sm:grid-cols-[96px_1fr_auto_auto] sm:items-center sm:gap-y-0"
              >
                <Link href={i.url} tabIndex={-1} aria-hidden="true" className="relative row-span-1 aspect-square">
                  <Image src={asset(i.image)} alt="" fill sizes="96px" className="object-contain" />
                </Link>
                <div className="min-w-0">
                  <Link href={i.url} className="line-clamp-2 text-[14px] font-medium leading-snug text-ink hover:text-brand">
                    {i.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted">Арт. {i.sku}</p>
                  <p className="mt-1 text-[13px] text-muted">от {formatPriceValue(i.price)}</p>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:justify-end">
                  <QtyStepper id={i.id} qty={i.qty} title={i.title} />
                  <button
                    type="button"
                    aria-label={`Удалить: ${i.title}`}
                    data-remove={i.id}
                    onClick={() => remove(i.id)}
                    className="grid size-9 place-items-center rounded-lg text-muted hover:text-brand sm:hidden"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
                <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:justify-end sm:gap-3">
                  <span className="text-base font-bold tabular-nums sm:w-28 sm:text-right">
                    {formatPriceValue(i.qty * i.price)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Удалить: ${i.title}`}
                    data-remove={i.id}
                    onClick={() => remove(i.id)}
                    className="hidden size-9 place-items-center rounded-lg text-muted hover:text-brand sm:grid"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => clearCart()}
            className="mt-4 text-[13px] font-medium text-muted underline hover:text-brand"
          >
            Очистить корзину
          </button>
        </div>

        <Summary items={items} />
      </Container>
    </section>
  );
}

type Sent = { text: string; opened: boolean };

const MAILTO_LIMIT = 1800;

function Summary({ items }: { items: readonly CartItem[] }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const area = useRef<HTMLTextAreaElement>(null);
  const total = cartTotal(items);
  const count = cartCount(items);
  const reached = total >= MIN_ORDER;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const opt = (label: string, val: string) => (val ? [`${label}: ${val}`] : []);
    const contacts = (comment: string) => [
      "Контакты:",
      `Имя: ${v("name")}`,
      `Телефон: ${v("phone")}`,
      ...opt("Компания", v("company")),
      ...opt("Email", v("email")),
      ...opt("Комментарий", comment),
    ];
    const totalLine = `Итого: от ${formatPriceValue(total)}`;
    const build = (lines: string[], comment: string) =>
      ["Состав заказа:", ...lines, "", totalLine, "", ...contacts(comment)].join("\r\n");
    const full = build(
      items.map((i) => `${i.title} — ${i.sku} — ${i.qty} шт × ${formatPriceValue(i.price)} = ${formatPriceValue(i.qty * i.price)}`),
      v("comment"),
    );
    const url = (body: string) =>
      `mailto:${site.email}?subject=${encodeURIComponent("Заказ с сайта ProStyle")}&body=${encodeURIComponent(body)}`;

    let href: string | null = url(full);
    if (href.length > MAILTO_LIMIT) {
      const compact = items.map((i) => `арт. ${i.sku} × ${i.qty} шт = ${formatPriceValue(i.qty * i.price)}`);
      href = url(build(compact, ""));
      if (href.length <= MAILTO_LIMIT) {
        let c = v("comment");
        while (c && url(build(compact, c)).length > MAILTO_LIMIT) c = c.slice(0, Math.max(0, c.length - 10));
        href = url(build(compact, c));
      } else {
        href = null;
      }
    }
    setCopied("");
    setSent({ text: full, opened: href !== null });
    if (href) window.open(href, "_self");
  }

  async function copy() {
    if (!sent) return;
    try {
      await navigator.clipboard.writeText(sent.text.replace(/\r\n/g, "\n"));
      setCopied("ok");
    } catch {
      area.current?.select();
      setCopied("fail");
    }
  }

  return (
    <aside aria-label="Итого" className="rounded-[14px] bg-surface p-5 md:p-6 lg:sticky lg:top-4">
          <div aria-live="polite" aria-atomic="true">
            <p className="text-sm text-muted">Товаров: {count}</p>
            <p className="mt-1 text-[22px] font-bold md:text-[26px]">Итого: от {formatPriceValue(total)}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white" aria-hidden="true">
              <div
                className="h-full rounded-full bg-brand motion-safe:transition-[width]"
                style={{ width: `${Math.min(100, (total / MIN_ORDER) * 100)}%` }}
              />
            </div>
            <p className={`mt-2 text-[13px] ${reached ? "font-medium text-new-text" : "text-muted"}`}>
              {reached
                ? "Минимальная сумма заказа достигнута ✓"
                : `Добавьте ещё на ${formatPriceValue(MIN_ORDER - total)} до минимального заказа`}
            </p>
          </div>
          {!open ? (
            <button
              type="button"
              disabled={!reached}
              onClick={() => setOpen(true)}
              className={`${btnPrimary} mt-5 w-full`}
            >
              Оформить заказ
            </button>
          ) : null}
          {open ? (
            <form onSubmit={submit} className="mt-5 grid gap-4">
              <label className="block text-sm font-medium text-ink">
                Имя <span className="text-brand">*</span>
                <input name="name" type="text" required autoComplete="name" className={field} />
              </label>
              <label className="block text-sm font-medium text-ink">
                Телефон <span className="text-brand">*</span>
                <input name="phone" type="tel" required autoComplete="tel" className={field} />
              </label>
              <label className="block text-sm font-medium text-ink">
                Компания
                <input name="company" type="text" autoComplete="organization" className={field} />
              </label>
              <label className="block text-sm font-medium text-ink">
                Email
                <input name="email" type="email" autoComplete="email" className={field} />
              </label>
              <label className="block text-sm font-medium text-ink">
                Комментарий
                <textarea name="comment" rows={3} className={field} />
              </label>
              <label className="flex items-start gap-2.5 text-[13px] text-muted">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 size-4 shrink-0 accent-[#D02E31] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                />
                <span>
                  Согласен на обработку{" "}
                  <Link href="/personal-data-processing" className="text-brand underline hover:text-brand-hover">
                    персональных данных
                  </Link>{" "}
                  <span className="text-brand">*</span>
                </span>
              </label>
              <button type="submit" disabled={!reached} className={`${btnPrimary} w-full`}>
                Отправить заказ
              </button>
              {sent ? (
                <div role="status" className="grid gap-2 text-[13px] text-muted">
                  {sent.opened ? (
                    <p>
                      Мы откроем ваш почтовый клиент. Если письмо не открылось — позвоните{" "}
                      <a href={site.phone.href} className="font-medium text-ink hover:text-brand">{site.phone.label}</a>
                    </p>
                  ) : null}
                  <p>
                    Скопируйте заказ и отправьте на{" "}
                    <a href={`mailto:${site.email}`} className="font-medium text-ink hover:text-brand">{site.email}</a>{" "}
                    или позвоните{" "}
                    <a href={site.phone.href} className="font-medium text-ink hover:text-brand">{site.phone.label}</a>
                  </p>
                  <label className="sr-only" htmlFor="order-text">Текст заказа</label>
                  <textarea id="order-text" ref={area} readOnly rows={8} value={sent.text.replace(/\r\n/g, "\n")} className={`${field} mt-0 text-[13px]`} />
                  <button type="button" onClick={copy} className={btnOutline}>Скопировать заказ</button>
                  {copied === "ok" ? <p className="font-medium text-new-text">Заказ скопирован</p> : null}
                  {copied === "fail" ? <p>Не удалось скопировать — выделите текст и скопируйте вручную</p> : null}
                </div>
              ) : null}
            </form>
          ) : null}
        </aside>
  );
}
