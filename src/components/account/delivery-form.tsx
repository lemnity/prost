"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Check, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { PhoneInput, isPhoneComplete } from "@/components/ui/phone-input";
import { site } from "@/content/site";
import { deliveryLabel } from "@/lib/cart/order-text";
import { updateDelivery, type Address, type DeliveryMethod, type DeliveryPrefs, type Profile } from "@/lib/account/store";
import { useSession } from "@/lib/account/use-account";
import { Field, field } from "./form-kit";

const METHODS: DeliveryMethod[] = ["pickup", "courier", "region"];
const HINTS: Record<DeliveryMethod, string> = {
  pickup: `${site.address}. ${site.hours}`,
  courier: "Доставим по указанному адресу в Тюмени",
  region: "Отправим транспортной компанией в любой город России",
};

/** Настройки из кабинета; для старых кабинетов — адрес из профиля. */
function initialPrefs(p: Profile): DeliveryPrefs {
  if (p.delivery) return p.delivery;
  const legacy: Address[] = p.address
    ? [{ id: "legacy", label: "Основной", city: p.city, address: p.address, recipient: [p.lastName, p.name].filter(Boolean).join(" "), phone: p.phone, comment: "" }]
    : [];
  return { method: "pickup", addresses: legacy, defaultId: legacy[0]?.id ?? null };
}

export function DeliverySection() {
  const s = useSession();
  return s ? <DeliveryInner key={s.profile.email} profile={s.profile} /> : null;
}

function DeliveryInner({ profile }: { profile: Profile }) {
  const prefs = initialPrefs(profile);
  const [editing, setEditing] = useState<Address | null>(null);
  const save = (next: Partial<DeliveryPrefs>) => updateDelivery({ ...prefs, ...next });
  const card = "rounded-[14px] bg-surface p-5 md:p-6";

  return (
    <div className="grid gap-4">
      <section aria-labelledby="d-method" className={card}>
        <h2 id="d-method" className="text-[18px] font-bold">Способ получения по умолчанию</h2>
        <p className="mt-1 text-[13px] text-muted">Будет выбран при оформлении заявки — его можно поменять в любой момент.</p>
        <fieldset className="mt-4 grid gap-3 sm:grid-cols-3">
          <legend className="sr-only">Способ получения</legend>
          {METHODS.map((m) => {
            const on = prefs.method === m;
            return (
              <label
                key={m}
                className={`flex cursor-pointer items-start gap-3 rounded-[10px] border bg-white p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${on ? "border-brand" : "border-line"}`}
              >
                <input type="radio" name="d-method" checked={on} onChange={() => save({ method: m })} className="mt-0.5 size-4 shrink-0 accent-[#D02E31]" />
                <span>
                  <span className="block text-[15px] font-medium">{deliveryLabel[m]}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-muted">{HINTS[m]}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
      </section>

      <section aria-labelledby="d-addresses" className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="d-addresses" className="text-[18px] font-bold">Адреса доставки</h2>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing({ id: "", label: "", city: "", address: "", recipient: [profile.lastName, profile.name].filter(Boolean).join(" "), phone: profile.phone, comment: "" })}
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              <Plus size={15} aria-hidden="true" /> Добавить адрес
            </button>
          ) : null}
        </div>

        {editing ? (
          <AddressForm
            key={editing.id || "new"}
            initial={editing}
            onCancel={() => setEditing(null)}
            onSave={(a) => {
              const exists = prefs.addresses.some((x) => x.id === a.id);
              const addresses = exists ? prefs.addresses.map((x) => (x.id === a.id ? a : x)) : [...prefs.addresses, a];
              save({ addresses, defaultId: prefs.defaultId ?? a.id });
              setEditing(null);
            }}
          />
        ) : null}

        {prefs.addresses.length ? (
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
            {prefs.addresses.map((a) => {
              const main = a.id === (prefs.defaultId ?? prefs.addresses[0]?.id);
              return (
                <li key={a.id} className={`flex flex-col rounded-[12px] border bg-white p-4 ${main ? "border-brand" : "border-line"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex items-center gap-2 text-[15px] font-semibold">
                      <MapPin size={16} aria-hidden="true" className="shrink-0 text-brand" />
                      {a.label || a.city || "Адрес"}
                    </p>
                    {main ? <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">Основной</span> : null}
                  </div>
                  <p className="mt-2 text-[14px]">{[a.city, a.address].filter(Boolean).join(", ")}</p>
                  <p className="mt-1 text-[13px] text-muted">{[a.recipient, a.phone].filter(Boolean).join(" · ")}</p>
                  {a.comment ? <p className="mt-1 text-[13px] text-muted">{a.comment}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[13px] font-medium">
                    {!main ? (
                      <button type="button" onClick={() => save({ defaultId: a.id })} className="inline-flex items-center gap-1 text-muted hover:text-brand">
                        <Check size={14} aria-hidden="true" /> Сделать основным
                      </button>
                    ) : null}
                    <button type="button" onClick={() => setEditing(a)} className="inline-flex items-center gap-1 text-muted hover:text-brand">
                      <Pencil size={14} aria-hidden="true" /> Изменить
                    </button>
                    <button
                      type="button"
                      aria-label={`Удалить адрес ${a.label || a.address}`}
                      onClick={() => {
                        const addresses = prefs.addresses.filter((x) => x.id !== a.id);
                        save({ addresses, defaultId: main ? addresses[0]?.id ?? null : prefs.defaultId });
                      }}
                      className="inline-flex items-center gap-1 text-muted hover:text-brand"
                    >
                      <Trash2 size={14} aria-hidden="true" /> Удалить
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : !editing ? (
          <p className="mt-3 text-[14px] text-muted">Сохраните адрес офиса или склада — он подставится в заявку при доставке курьером или в регион.</p>
        ) : null}
      </section>

      <p className="text-[13px] text-muted">
        Стоимость и сроки доставки менеджер рассчитает после подтверждения заявки. Подробнее —{" "}
        <Link href="/delivery" className="text-brand underline hover:text-brand-hover">Доставка и оплата</Link>.
      </p>
    </div>
  );
}

type Key = "city" | "address" | "phone";

function AddressForm({ initial, onSave, onCancel }: { initial: Address; onSave: (a: Address) => void; onCancel: () => void }) {
  const [a, setA] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const set = (k: keyof Address, v: string) => {
    setA((p) => ({ ...p, [k]: v }));
    setErrors((p) => (k in p ? { ...p, [k]: undefined } : p));
  };
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs: Partial<Record<Key, string>> = {};
    if (!a.city.trim()) errs.city = "Укажите город";
    if (!a.address.trim()) errs.address = "Укажите адрес";
    if (a.phone && !isPhoneComplete(a.phone)) errs.phone = "Введите номер полностью";
    setErrors(errs);
    const first = (["city", "address", "phone"] as Key[]).find((k) => errs[k]);
    if (first) return document.getElementById(`f-${first}`)?.focus();
    const trim = (v: string) => v.trim();
    onSave({
      id: a.id || `a${Date.now().toString(36)}`,
      label: trim(a.label), city: trim(a.city), address: trim(a.address),
      recipient: trim(a.recipient), phone: trim(a.phone), comment: trim(a.comment),
    });
  }
  return (
    <form noValidate onSubmit={submit} aria-label={initial.id ? "Изменение адреса" : "Новый адрес"} className="mt-4 grid gap-4 rounded-[12px] border border-line bg-white p-4 sm:grid-cols-2">
      <Field name="label" label="Название" hint="Например: Офис, Склад">
        {(p) => <input {...p} type="text" value={a.label} onChange={(e) => set("label", e.target.value)} className={field} />}
      </Field>
      <Field name="city" label="Город" required error={errors.city}>
        {(p) => <input {...p} type="text" autoComplete="address-level2" value={a.city} onChange={(e) => set("city", e.target.value)} className={field} />}
      </Field>
      <Field name="address" label="Улица, дом, офис" required error={errors.address} wide>
        {(p) => <input {...p} type="text" autoComplete="street-address" value={a.address} onChange={(e) => set("address", e.target.value)} className={field} />}
      </Field>
      <Field name="recipient" label="Получатель">
        {(p) => <input {...p} type="text" autoComplete="name" value={a.recipient} onChange={(e) => set("recipient", e.target.value)} className={field} />}
      </Field>
      <Field name="phone" label="Телефон получателя" error={errors.phone}>
        {(p) => <PhoneInput {...p} value={a.phone} onValueChange={(v) => set("phone", v)} className={field} />}
      </Field>
      <Field name="comment" label="Комментарий для курьера" wide>
        {(p) => <input {...p} type="text" value={a.comment} onChange={(e) => set("comment", e.target.value)} placeholder="Пропуск, этаж, время приёма" className={field} />}
      </Field>
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button type="submit" className={buttonClass()}>Сохранить адрес</button>
        <button type="button" onClick={onCancel} className={buttonClass({ variant: "outline" })}>Отмена</button>
      </div>
    </form>
  );
}
