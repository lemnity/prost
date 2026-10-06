"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PhoneInput, isPhoneComplete } from "@/components/ui/phone-input";
import { buttonClass } from "@/components/ui/button";
import { signIn, signUp } from "@/lib/account/store";
import { site } from "@/content/site";
import { Field, MarketingCheckbox, PasswordInput, field, isEmail } from "./form-kit";

const MIN_PASSWORD = 8;
const submitCls = `${buttonClass({ size: "lg" })} w-full disabled:cursor-wait`;

function focusFirst<K extends string>(order: K[], errs: Partial<Record<K, string>>) {
  const first = order.find((k) => errs[k]);
  if (first) document.getElementById(`f-${first}`)?.focus();
  return !!first;
}

type LoginErrors = Partial<Record<"email" | "password", string>>;

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs: LoginErrors = {};
    if (!email.trim()) errs.email = "Укажите email";
    else if (!isEmail(email)) errs.email = "Проверьте адрес электронной почты";
    if (!password) errs.password = "Введите пароль";
    setErrors(errs);
    if (focusFirst(["email", "password"], errs)) return;
    setBusy(true);
    const res = await signIn(email, password);
    setBusy(false);
    if (!res.ok) {
      setErrors({ [res.field]: res.error });
      document.getElementById(`f-${res.field}`)?.focus();
      return;
    }
    router.push("/account");
  }

  return (
    <form noValidate onSubmit={submit} className="grid gap-4">
      <Field name="email" label="Email" required error={errors.email}>
        {(p) => (
          <input
            {...p}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })); }}
            className={field}
          />
        )}
      </Field>
      <Field
        name="password"
        label="Пароль"
        required
        error={errors.password}
        aside={
          <Link href="/contact-us#callback" className="text-[13px] text-muted underline hover:text-brand">
            Забыли пароль?
          </Link>
        }
      >
        {(p) => (
          <PasswordInput
            {...p}
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: undefined })); }}
          />
        )}
      </Field>
      <button type="submit" disabled={busy} aria-busy={busy} className={`${submitCls} mt-2`}>
        {busy ? "Входим…" : "Войти"}
      </button>
      <p className="text-center text-[14px] text-muted">
        Нет кабинета?{" "}
        <Link href="/account/register" className="font-semibold text-brand hover:text-brand-hover">
          Создать
        </Link>
      </p>
    </form>
  );
}

type RegKey = "name" | "company" | "inn" | "phone" | "email" | "password" | "consent";
type RegErrors = Partial<Record<RegKey, string>>;
const REG_ORDER: RegKey[] = ["name", "company", "inn", "phone", "email", "password", "consent"];

export function RegisterForm() {
  const router = useRouter();
  const [d, setD] = useState({ lastName: "", name: "", middleName: "", company: "", inn: "", phone: "", email: "", password: "" });
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [errors, setErrors] = useState<RegErrors>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof d, v: string) => {
    setD((p) => ({ ...p, [k]: v }));
    setErrors((p) => (k in p ? { ...p, [k]: undefined } : p));
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs: RegErrors = {};
    if (!d.name.trim()) errs.name = "Укажите имя";
    if (d.inn && !/^(\d{10}|\d{12})$/.test(d.inn)) errs.inn = "ИНН состоит из 10 или 12 цифр";
    if (!d.phone.trim()) errs.phone = "Укажите телефон";
    else if (!isPhoneComplete(d.phone)) errs.phone = "Введите номер полностью";
    if (!d.email.trim()) errs.email = "Укажите email";
    else if (!isEmail(d.email)) errs.email = "Проверьте адрес электронной почты";
    if (d.password.length < MIN_PASSWORD) errs.password = `Минимум ${MIN_PASSWORD} символов`;
    if (!consent) errs.consent = "Необходимо согласие на обработку персональных данных";
    setErrors(errs);
    if (focusFirst(REG_ORDER, errs)) return;
    setBusy(true);
    const res = await signUp(
      { name: d.name.trim(), lastName: d.lastName.trim(), middleName: d.middleName.trim(), company: d.company.trim(), inn: d.inn, phone: d.phone.trim(), email: d.email, city: "", address: "", marketing },
      d.password,
    );
    setBusy(false);
    if (!res.ok) {
      setErrors({ [res.field]: res.error });
      document.getElementById(`f-${res.field}`)?.focus();
      return;
    }
    router.push("/account");
  }

  return (
    <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
        <Field name="lastName" label="Фамилия">
          {(p) => <input {...p} type="text" autoComplete="family-name" value={d.lastName} onChange={(e) => set("lastName", e.target.value)} className={field} />}
        </Field>
        <Field name="name" label="Имя" required error={errors.name}>
          {(p) => <input {...p} type="text" autoComplete="given-name" value={d.name} onChange={(e) => set("name", e.target.value)} className={field} />}
        </Field>
        <Field name="middleName" label="Отчество">
          {(p) => <input {...p} type="text" autoComplete="additional-name" value={d.middleName} onChange={(e) => set("middleName", e.target.value)} className={field} />}
        </Field>
      </div>
      <Field name="company" label="Компания" error={errors.company}>
        {(p) => <input {...p} type="text" autoComplete="organization" value={d.company} onChange={(e) => set("company", e.target.value)} className={field} />}
      </Field>
      <Field name="inn" label="ИНН" error={errors.inn} hint="Для выставления счёта">
        {(p) => (
          <input {...p} type="text" inputMode="numeric" maxLength={12} value={d.inn} onChange={(e) => set("inn", e.target.value.replace(/\D/g, ""))} className={field} />
        )}
      </Field>
      <Field name="phone" label="Телефон" required error={errors.phone}>
        {(p) => <PhoneInput {...p} value={d.phone} onValueChange={(v) => set("phone", v)} className={field} />}
      </Field>
      <Field name="email" label="Email" required error={errors.email}>
        {(p) => <input {...p} type="email" autoComplete="email" value={d.email} onChange={(e) => set("email", e.target.value)} className={field} />}
      </Field>
      <Field name="password" label="Пароль" required error={errors.password} hint={`Не короче ${MIN_PASSWORD} символов`} wide>
        {(p) => <PasswordInput {...p} autoComplete="new-password" value={d.password} onChange={(e) => set("password", e.target.value)} />}
      </Field>
      <div className="sm:col-span-2">
        <label className="flex items-start gap-2.5 text-[13px] text-muted">
          <input
            id="f-consent"
            type="checkbox"
            checked={consent}
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? "f-consent-err" : undefined}
            onChange={(e) => { setConsent(e.target.checked); setErrors((p) => ({ ...p, consent: undefined })); }}
            className="mt-0.5 size-4 shrink-0 accent-[#D02E31] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          />
          <span>
            Согласен на обработку{" "}
            <Link href="/personal-data-processing" className="text-brand underline hover:text-brand-hover">персональных данных</Link>{" "}
            <span className="text-brand">*</span>
          </span>
        </label>
        {errors.consent ? <p id="f-consent-err" className="mt-1.5 text-[13px] text-brand">{errors.consent}</p> : null}
        <MarketingCheckbox checked={marketing} onChange={setMarketing} className="mt-3" />
      </div>
      <div className="grid gap-4 sm:col-span-2">
        <button type="submit" disabled={busy} aria-busy={busy} className={submitCls}>
          {busy ? "Создаём кабинет…" : "Создать кабинет"}
        </button>
        <p className="text-center text-[14px] text-muted">
          Уже есть кабинет?{" "}
          <Link href="/account/login" className="font-semibold text-brand hover:text-brand-hover">Войти</Link>
        </p>
        <p className="text-center text-[12px] text-muted">
          Вопросы по кабинету — <a href={site.phone.href} className="hover:text-brand">{site.phone.label}</a>
        </p>
      </div>
    </form>
  );
}
