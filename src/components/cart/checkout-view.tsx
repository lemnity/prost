"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Gift, ShoppingCart, UserRound, X } from "lucide-react";
import { PhoneInput, isPhoneComplete } from "@/components/ui/phone-input";
import { Container } from "@/components/ui/container";
import { asset } from "@/lib/asset";
import { plural } from "@/lib/plural";
import { formatPriceValue } from "@/lib/format";
import { site } from "@/content/site";
import { MIN_ORDER, cartCount, cartDiscount, cartTotal, setPromo, type CartItem } from "@/lib/cart/store";
import { useCart, useHydrated, usePromo } from "@/lib/cart/use-cart";
import {
  buildOrder,
  deliveryLabel,
  orderNumber,
  paymentLabel,
  type Delivery,
  type OrderData,
  type Payment,
} from "@/lib/cart/order-text";
import { buttonClass } from "@/components/ui/button";
import { fullName, greetName, saveOrder } from "@/lib/account/store";
import { startChat } from "@/lib/chat/agent";
import { useSession } from "@/lib/account/use-account";

const field =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3.5 py-3 text-[15px] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand aria-[invalid=true]:border-brand";
const btnPrimary = buttonClass({ size: "lg", px: "px-8" });
const btnOutline = buttonClass({ variant: "outline", size: "lg" });

type Errors = Partial<Record<keyof OrderData | "consent", string>>;
const ORDER: (keyof OrderData | "consent")[] = [
  "name", "phone", "email", "company", "inn", "city", "address", "consent",
];

const INITIAL: OrderData = {
  name: "", phone: "", email: "", company: "", inn: "",
  delivery: "pickup", city: "", address: "", payment: "invoice", comment: "",
};

function validate(d: OrderData, consent: boolean): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = "Укажите имя";
  if (!d.phone.trim()) e.phone = "Укажите телефон";
  else if (!isPhoneComplete(d.phone)) e.phone = "Введите номер полностью";
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = "Проверьте адрес электронной почты";
  if (d.payment === "invoice" && !d.company.trim()) e.company = "Для безналичного расчёта укажите компанию";
  if (d.inn ? !/^(\d{10}|\d{12})$/.test(d.inn) : d.payment === "invoice") {
    e.inn = d.inn ? "ИНН состоит из 10 или 12 цифр" : "Для безналичного расчёта укажите ИНН";
  }
  if (d.delivery === "region" && !d.city.trim()) e.city = "Укажите город";
  if (d.delivery !== "pickup" && !d.address.trim()) e.address = "Укажите адрес доставки";
  if (!consent) e.consent = "Необходимо согласие на обработку персональных данных";
  return e;
}

function Skeleton() {
  return (
    <section aria-label="Оформление загружается" aria-busy="true" className="py-6 md:py-8">
      <Container className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-h-[420px] animate-pulse rounded-[14px] bg-surface motion-reduce:animate-none" />
        <div className="hidden min-h-[260px] animate-pulse rounded-[14px] bg-surface motion-reduce:animate-none lg:block" />
      </Container>
    </section>
  );
}

function Gate({ title, text }: { title: string; text: string }) {
  return (
    <section aria-label={title} className="py-8 md:py-10">
      <Container>
        <div className="flex flex-col items-center rounded-[14px] bg-surface px-5 py-12 text-center md:py-16">
          <ShoppingCart size={40} strokeWidth={1.5} aria-hidden="true" className="text-brand" />
          <h2 className="mt-4 text-[22px] font-bold md:text-[26px]">{title}</h2>
          <p className="mt-2 max-w-md text-sm text-muted">{text}</p>
          <Link href="/cart" className={`${btnPrimary} mt-6`}>Вернуться в корзину</Link>
        </div>
      </Container>
    </section>
  );
}

function Card({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`step-${n}`} className="rounded-[14px] bg-surface p-5 md:p-6">
      <h2 id={`step-${n}`} className="flex items-center gap-3 text-[18px] font-bold md:text-[20px]">
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-brand text-sm text-white">{n}</span>
        {title}
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  name, label, required, error, wide, children,
}: {
  name: string; label: string; required?: boolean; error?: string; wide?: boolean;
  children: (p: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = `f-${name}`;
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label} {required ? <span className="text-brand">*</span> : null}
      </label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-err` : undefined })}
      {error ? <p id={`${id}-err`} className="mt-1.5 text-[13px] text-brand">{error}</p> : null}
    </div>
  );
}

function Radio<T extends string>({
  name, value, current, onChange, title, hint,
}: {
  name: string; value: T; current: T; onChange: (v: T) => void; title: string; hint?: string;
}) {
  const on = current === value;
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-[10px] border bg-white p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand sm:col-span-2 ${on ? "border-brand" : "border-line"}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={on}
        onChange={() => onChange(value)}
        className="mt-0.5 size-4 shrink-0 accent-[#D02E31]"
      />
      <span>
        <span className="block text-[15px] font-medium text-ink">{title}</span>
        {hint ? <span className="mt-0.5 block text-[13px] text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

function OrderLines({ items, expanded = true }: { items: readonly CartItem[]; expanded?: boolean }) {
  return (
    <ul className="grid gap-3">
      {items.map((i, idx) => (
        <li
          key={i.id}
          className={`grid grid-cols-[48px_1fr] items-center gap-3 ${idx >= 3 && !expanded ? "max-lg:hidden" : ""}`}
        >
          <span className="relative aspect-square rounded-md bg-white">
            <Image src={asset(i.image)} alt="" fill sizes="48px" className="object-contain" />
          </span>
          <span className="min-w-0 text-[13px] leading-snug">
            <span className="line-clamp-2 text-ink">{i.title}</span>
            <span className="text-muted">{i.qty} шт × {formatPriceValue(i.price)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Список позиций: на десктопе прокручивается внутри карточки с мягкими затуханиями, на мобильном — первые 3 + «Показать все». */
function OrderList({ items }: { items: readonly CartItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [edge, setEdge] = useState({ top: false, bottom: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setEdge({
        top: el.scrollTop > 2,
        bottom: el.scrollHeight - el.clientHeight - el.scrollTop > 2,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [items.length, expanded]);

  const mask = `linear-gradient(to bottom, ${edge.top ? "transparent 0, #000 20px" : "#000 0"}, ${
    edge.bottom ? "#000 calc(100% - 20px), transparent 100%" : "#000 100%"
  })`;

  return (
    <>
      <div
        ref={ref}
        tabIndex={0}
        aria-label="Список товаров в заказе"
        style={edge.top || edge.bottom ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
        className="min-h-0 flex-1 overscroll-contain pr-1 outline-none focus-visible:outline-2 focus-visible:outline-brand lg:overflow-y-auto lg:[scrollbar-color:#c4c4c6_transparent] lg:[scrollbar-width:thin]"
      >
        <OrderLines items={items} expanded={expanded} />
      </div>
      {items.length > 3 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 text-left text-[13px] font-medium text-muted underline hover:text-brand lg:hidden"
        >
          {expanded ? "Свернуть" : `Показать все ${items.length} ${plural("item", items.length)}`}
        </button>
      ) : null}
    </>
  );
}

function PromoBox() {
  const promo = usePromo();
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  function apply() {
    const code = val.trim().toUpperCase();
    if (!code) return setErr("Введите промокод");
    if (code.length > 32 || !/^[A-Z0-9-]+$/.test(code))
      return setErr("Промокод: латинские буквы, цифры и дефис, до 32 символов");
    setErr("");
    setVal("");
    setPromo(code);
  }
  return (
    <div className="mt-5 border-t border-line pt-4">
      {promo ? (
        <p role="status" className="flex items-start justify-between gap-2 text-[13px] text-new-text">
          <span>Промокод {promo} будет учтён менеджером при подтверждении заказа</span>
          <button
            type="button"
            aria-label="Убрать промокод"
            onClick={() => setPromo("")}
            className="grid size-6 shrink-0 place-items-center rounded text-muted hover:text-brand"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </p>
      ) : (
        <>
          <label htmlFor="f-promo" className="text-sm font-medium text-ink">Промокод</label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="f-promo"
              type="text"
              maxLength={32}
              autoComplete="off"
              value={val}
              aria-invalid={!!err}
              aria-describedby={err ? "f-promo-err" : undefined}
              onChange={(e) => { setVal(e.target.value); setErr(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }}
              className="block h-11 min-w-0 flex-1 rounded-lg border border-line bg-white px-3.5 text-[15px] uppercase text-ink placeholder:normal-case placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand aria-[invalid=true]:border-brand"
            />
            <button type="button" onClick={apply} className={btnOutline}>Применить</button>
          </div>
          {err ? <p id="f-promo-err" className="mt-1.5 text-[13px] text-brand">{err}</p> : null}
        </>
      )}
    </div>
  );
}

export function CheckoutView() {
  const items = useCart();
  const promo = usePromo();
  const hydrated = useHydrated();
  const [d, setD] = useState<OrderData>(INITIAL);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const session = useSession();
  const [prefilled, setPrefilled] = useState(false);
  // Данные кабинета подставляются один раз, не перетирая уже введённое.
  if (session && !prefilled) {
    setPrefilled(true);
    const pr = session.profile;
    setD((p) => ({
      ...p,
      name: p.name || fullName(pr),
      phone: p.phone || pr.phone,
      email: p.email || pr.email,
      company: p.company || pr.company,
      inn: p.inn || pr.inn,
      city: p.city || pr.city,
      address: p.address || pr.address,
    }));
  }

  const total = cartTotal(items);
  const discount = cartDiscount(items);
  const set = <K extends keyof OrderData>(k: K, v: OrderData[K]) => {
    setD((p) => ({ ...p, [k]: v }));
    setErrors((p) => (p[k] ? { ...p, [k]: undefined } : p));
  };

  if (!hydrated) return <Skeleton />;

  if (sent) return <Skeleton />;

  if (items.length === 0) return <Gate title="Корзина пуста" text="Добавьте товары в корзину, чтобы оформить заказ." />;
  if (total < MIN_ORDER)
    return (
      <Gate
        title="Минимальная сумма заказа не достигнута"
        text={`Добавьте ещё на ${formatPriceValue(MIN_ORDER - total)} до минимального заказа ${formatPriceValue(MIN_ORDER)}.`}
      />
    );

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean: OrderData = {
      ...d,
      name: d.name.trim(), phone: d.phone.trim(), email: d.email.trim(), company: d.company.trim(),
      inn: d.inn.replace(/\s/g, ""), city: d.city.trim(), address: d.address.trim(), comment: d.comment.trim(),
    };
    const errs = validate(clean, consent);
    setErrors(errs);
    const first = ORDER.find((k) => errs[k]);
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    const { text, href } = buildOrder(items, clean, promo);
    const number = orderNumber();
    saveOrder({
      number,
      date: new Date().toISOString(),
      total,
      items: [...items],
      delivery: deliveryLabel[clean.delivery],
      payment: paymentLabel[clean.payment],
    });
    const name = session ? greetName(session.profile) : clean.name.split(/\s+/)[0];
    startChat({
      number,
      name,
      total,
      items: [...items],
      orderText: text,
      mailOpened: href !== null,
      owner: session?.profile.email ?? null,
    });
    setSent(true);
    if (href) window.open(href, "_self");
    router.push(`/account/chat?order=${encodeURIComponent(number)}`);
  }

  const count = cartCount(items);
  const submitBtn = (
    <button type="submit" className={`${btnPrimary} w-full`}>Отправить заказ</button>
  );

  return (
    <section aria-label="Оформление заказа" className="py-6 md:py-8">
      <Container>
        <form noValidate onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
          <div className="grid gap-4">
            {session ? (
              <div className="flex flex-col gap-3 rounded-[14px] bg-brand-soft p-4 sm:flex-row sm:items-center">
                <UserRound size={28} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand" />
                <p className="text-[14px] sm:flex-1">
                  <span className="font-semibold text-ink">Вы вошли как {fullName(session.profile)}.</span>
                  <span className="text-muted"> Данные из кабинета подставлены, заказ сохранится в истории.</span>
                </p>
                <Link href="/account/profile" className="text-[14px] font-semibold text-brand hover:text-brand-hover">Изменить профиль</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4 rounded-[14px] bg-brand-soft p-4 sm:flex-row sm:items-center">
                <Gift size={28} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand" />
                <div className="sm:flex-1">
                  <p className="text-[15px] font-semibold text-ink">Войдите в личный кабинет или создайте его</p>
                  <p className="mt-0.5 text-[13px] text-muted">данные подставятся в заказ, а заказы сохранятся в истории</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/account/login" className={btnPrimary}>Войти</Link>
                  <Link href="/account/register" className={btnOutline}>Создать кабинет</Link>
                </div>
              </div>
            )}
            <Card n={1} title="Контактные данные">
              <Field name="name" label="Имя" required error={errors.name}>
                {(p) => <input {...p} type="text" autoComplete="name" value={d.name} onChange={(e) => set("name", e.target.value)} className={field} />}
              </Field>
              <Field name="phone" label="Телефон" required error={errors.phone}>
                {(p) => <PhoneInput {...p} value={d.phone} onValueChange={(v) => set("phone", v)} className={field} />}
              </Field>
              <Field name="email" label="Email" error={errors.email}>
                {(p) => <input {...p} type="email" autoComplete="email" value={d.email} onChange={(e) => set("email", e.target.value)} className={field} />}
              </Field>
              <Field name="company" label="Компания" required={d.payment === "invoice"} error={errors.company}>
                {(p) => <input {...p} type="text" autoComplete="organization" value={d.company} onChange={(e) => set("company", e.target.value)} className={field} />}
              </Field>
              <Field name="inn" label="ИНН" required={d.payment === "invoice"} error={errors.inn}>
                {(p) => <input {...p} type="text" inputMode="numeric" maxLength={12} value={d.inn} onChange={(e) => set("inn", e.target.value.replace(/\D/g, ""))} className={field} />}
              </Field>
            </Card>

            <Card n={2} title="Способ получения">
              <fieldset className="contents">
                <legend className="sr-only">Способ получения</legend>
                {(["pickup", "courier", "region"] as Delivery[]).map((v) => (
                  <Radio
                    key={v}
                    name="delivery"
                    value={v}
                    current={d.delivery}
                    onChange={(x) => set("delivery", x)}
                    title={deliveryLabel[v]}
                    hint={v === "pickup" ? `${site.address}. ${site.hours}` : undefined}
                  />
                ))}
              </fieldset>
              {d.delivery === "region" ? (
                <Field name="city" label="Город" required error={errors.city}>
                  {(p) => <input {...p} type="text" autoComplete="address-level2" value={d.city} onChange={(e) => set("city", e.target.value)} className={field} />}
                </Field>
              ) : null}
              {d.delivery !== "pickup" ? (
                <Field name="address" label="Адрес доставки" required error={errors.address} wide={d.delivery === "courier"}>
                  {(p) => <input {...p} type="text" autoComplete="street-address" value={d.address} onChange={(e) => set("address", e.target.value)} className={field} />}
                </Field>
              ) : null}
            </Card>

            <Card n={3} title="Способ оплаты">
              <fieldset className="contents">
                <legend className="sr-only">Способ оплаты</legend>
                {(["invoice", "card", "cash"] as Payment[]).map((v) => (
                  <Radio
                    key={v}
                    name="payment"
                    value={v}
                    current={d.payment}
                    onChange={(x) => set("payment", x)}
                    title={paymentLabel[v]}
                    hint={v === "invoice" ? "Нужны компания и ИНН для выставления счёта" : undefined}
                  />
                ))}
              </fieldset>
            </Card>

            <Card n={4} title="Комментарий и согласие">
              <Field name="comment" label="Комментарий к заказу" wide>
                {(p) => <textarea {...p} rows={4} value={d.comment} onChange={(e) => set("comment", e.target.value)} className={field} />}
              </Field>
              <div className="sm:col-span-2">
                <label className="flex items-start gap-2.5 text-[13px] text-muted">
                  <input
                    id="f-consent"
                    type="checkbox"
                    checked={consent}
                    aria-invalid={!!errors.consent}
                    aria-describedby={errors.consent ? "f-consent-err" : undefined}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      setErrors((p) => ({ ...p, consent: undefined }));
                    }}
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
                {errors.consent ? <p id="f-consent-err" className="mt-1.5 text-[13px] text-brand">{errors.consent}</p> : null}
              </div>
            </Card>
          </div>

          <aside aria-label="Ваш заказ" className="flex flex-col rounded-[14px] bg-surface p-5 md:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100dvh_/_var(--zoom)_-_8rem)]">
            <h2 className="mb-4 shrink-0 text-[18px] font-bold">Ваш заказ ({items.length})</h2>
            <OrderList items={items} />
            <div className="shrink-0">
              <PromoBox />
            </div>
            <div className="mt-5 shrink-0 border-t border-line pt-4">
              <p className="text-sm text-muted">Товаров: {count}</p>
              {discount > 0 ? (
                <p className="mt-1 text-sm font-medium text-brand">Скидка: {`\u2212${formatPriceValue(discount)}`}</p>
              ) : null}
              <p className="mt-1 text-[22px] font-bold md:text-[26px]">Итого: от {formatPriceValue(total)}</p>
            </div>
            <div className="mt-5 shrink-0">{submitBtn}</div>
            <Link href="/cart" className="mt-3 block text-center text-[13px] font-medium text-muted underline hover:text-brand">
              Изменить корзину
            </Link>
          </aside>
        </form>
      </Container>
    </section>
  );
}
