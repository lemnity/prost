"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { PhoneInput, isPhoneComplete } from "@/components/ui/phone-input";
import { buttonClass } from "@/components/ui/button";
import { updateProfile, type Profile } from "@/lib/account/store";
import { useSession } from "@/lib/account/use-account";
import { Field, MarketingCheckbox, field } from "./form-kit";

type Key = "name" | "phone" | "inn";
type Errors = Partial<Record<Key, string>>;
const ORDER: Key[] = ["name", "phone", "inn"];

export function ProfileForm() {
  const s = useSession();
  return s ? <ProfileFormInner key={s.profile.email} initial={s.profile} /> : null;
}

function ProfileFormInner({ initial }: { initial: Profile }) {
  const [d, setD] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const set = (k: Exclude<keyof Profile, "marketing" | "marketingAt">, v: string) => {
    setD((p) => ({ ...p, [k]: v }));
    setSaved(false);
    setErrors((p) => (k in p ? { ...p, [k]: undefined } : p));
  };

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs: Errors = {};
    if (!d.name.trim()) errs.name = "Укажите имя";
    if (!d.phone.trim()) errs.phone = "Укажите телефон";
    else if (!isPhoneComplete(d.phone)) errs.phone = "Введите номер полностью";
    if (d.inn && !/^(\d{10}|\d{12})$/.test(d.inn)) errs.inn = "ИНН состоит из 10 или 12 цифр";
    setErrors(errs);
    const first = ORDER.find((k) => errs[k]);
    if (first) return document.getElementById(`f-${first}`)?.focus();
    updateProfile({
      name: d.name.trim(), lastName: (d.lastName ?? "").trim(), middleName: (d.middleName ?? "").trim(), phone: d.phone.trim(), company: d.company.trim(), inn: d.inn,
      city: d.city.trim(), address: d.address.trim(), marketing: d.marketing,
    });
    setSaved(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 3000);
  }

  const card = "rounded-[14px] bg-surface p-5 md:p-6";
  return (
    <form noValidate onSubmit={submit} className="grid gap-4">
      <section aria-labelledby="p-contacts" className={card}>
        <h2 id="p-contacts" className="text-[18px] font-bold">Контактные данные</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
            <Field name="lastName" label="Фамилия">
              {(p) => <input {...p} type="text" autoComplete="family-name" value={d.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} className={field} />}
            </Field>
            <Field name="name" label="Имя" required error={errors.name}>
              {(p) => <input {...p} type="text" autoComplete="given-name" value={d.name} onChange={(e) => set("name", e.target.value)} className={field} />}
            </Field>
            <Field name="middleName" label="Отчество">
              {(p) => <input {...p} type="text" autoComplete="additional-name" value={d.middleName ?? ""} onChange={(e) => set("middleName", e.target.value)} className={field} />}
            </Field>
          </div>
          <Field name="phone" label="Телефон" required error={errors.phone}>
            {(p) => <PhoneInput {...p} value={d.phone} onValueChange={(v) => set("phone", v)} className={field} />}
          </Field>
          <Field name="email" label="Email" hint="Email — логин кабинета, его не изменить" wide>
            {(p) => <input {...p} type="email" value={d.email} readOnly className={`${field} bg-surface text-muted`} />}
          </Field>
        </div>
      </section>
      <section aria-labelledby="p-company" className={card}>
        <h2 id="p-company" className="text-[18px] font-bold">Компания</h2>
        <p className="mt-1 text-[13px] text-muted">Подставляются в заказ для безналичного расчёта.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field name="company" label="Название компании">
            {(p) => <input {...p} type="text" autoComplete="organization" value={d.company} onChange={(e) => set("company", e.target.value)} className={field} />}
          </Field>
          <Field name="inn" label="ИНН" error={errors.inn}>
            {(p) => <input {...p} type="text" inputMode="numeric" maxLength={12} value={d.inn} onChange={(e) => set("inn", e.target.value.replace(/\D/g, ""))} className={field} />}
          </Field>
        </div>
      </section>
      <section aria-labelledby="p-delivery" className={card}>
        <h2 id="p-delivery" className="text-[18px] font-bold">Доставка</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field name="city" label="Город">
            {(p) => <input {...p} type="text" autoComplete="address-level2" value={d.city} onChange={(e) => set("city", e.target.value)} className={field} />}
          </Field>
          <Field name="address" label="Адрес">
            {(p) => <input {...p} type="text" autoComplete="street-address" value={d.address} onChange={(e) => set("address", e.target.value)} className={field} />}
          </Field>
        </div>
      </section>
      <section aria-labelledby="p-mailing" className={card}>
        <h2 id="p-mailing" className="text-[18px] font-bold">Рассылки</h2>
        <MarketingCheckbox
          checked={d.marketing}
          onChange={(v) => { setD((p) => ({ ...p, marketing: v })); setSaved(false); }}
          className="mt-4"
        />
      </section>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className={buttonClass({ size: "lg", px: "px-8" })}>Сохранить</button>
        <p role="status" className="flex items-center gap-1.5 text-[14px] font-medium text-new-text">
          {saved ? (
            <>
              <Check size={16} aria-hidden="true" /> Изменения сохранены
            </>
          ) : null}
        </p>
      </div>
    </form>
  );
}
