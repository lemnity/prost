"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { PhoneInput, isPhoneComplete } from "@/components/ui/phone-input";
import { applications } from "@/content/home";
import { site } from "@/content/site";
import {
  BRANDBOOK, BUDGETS, CITIES, KINDS, buildBrief, type BriefData,
} from "@/lib/brief-text";

const field =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3.5 py-3 text-[15px] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand aria-[invalid=true]:border-brand";
const btnPrimary =
  "inline-flex h-[52px] items-center justify-center rounded-lg bg-brand px-8 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover";
const btnOutline =
  "inline-flex h-12 items-center justify-center rounded-lg border border-brand bg-white px-6 text-[15px] font-semibold text-brand hover:bg-brand hover:text-white";

type Key = keyof BriefData | "consent";
type Errors = Partial<Record<Key, string>>;
const ORDER: Key[] = ["company", "name", "phone", "email", "kinds", "qty", "idea", "consent"];

const INITIAL: BriefData = {
  company: "", name: "", phone: "", email: "", city: CITIES[0],
  kinds: [], qty: "", budget: "", deadline: "", occasion: "",
  idea: "", prints: [], brandbook: "",
};

function validate(d: BriefData, consent: boolean): Errors {
  const e: Errors = {};
  if (!d.company.trim()) e.company = "Укажите компанию";
  if (!d.name.trim()) e.name = "Укажите контактное лицо";
  if (!d.phone.trim()) e.phone = "Укажите телефон";
  else if (!isPhoneComplete(d.phone)) e.phone = "Введите номер полностью";
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = "Проверьте адрес электронной почты";
  if (!d.kinds.length) e.kinds = "Выберите, что нужно изготовить";
  if (!d.qty.trim()) e.qty = "Укажите примерный тираж";
  if (!d.idea.trim()) e.idea = "Опишите идею";
  if (!consent) e.consent = "Необходимо согласие на обработку персональных данных";
  return e;
}

function Card({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`brief-step-${n}`} className="rounded-[14px] bg-surface p-5 md:p-6">
      <h2 id={`brief-step-${n}`} className="flex items-center gap-3 text-[18px] font-bold md:text-[20px]">
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
  const id = `b-${name}`;
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

function Chips({
  legend, required, options, value, onChange, error, id,
}: {
  legend: string; required?: boolean; options: string[]; value: string[];
  onChange: (v: string[]) => void; error?: string; id: string;
}) {
  return (
    <fieldset className="sm:col-span-2" aria-describedby={error ? `${id}-err` : undefined}>
      <legend className="text-sm font-medium text-ink">
        {legend} {required ? <span className="text-brand">*</span> : null}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o, i) => {
          const on = value.includes(o);
          return (
            <label
              key={o}
              className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-[14px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${on ? "border-brand bg-brand-soft font-medium text-brand" : "border-line bg-white text-ink hover:border-faint"}`}
            >
              <input
                id={i === 0 ? id : undefined}
                type="checkbox"
                checked={on}
                aria-invalid={!!error}
                onChange={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
                className="sr-only"
              />
              {o}
            </label>
          );
        })}
      </div>
      {error ? <p id={`${id}-err`} className="mt-1.5 text-[13px] text-brand">{error}</p> : null}
    </fieldset>
  );
}

function CopyBlock({ text }: { text: string }) {
  const [state, setState] = useState<"" | "ok" | "fail">("");
  const area = useRef<HTMLTextAreaElement>(null);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("ok");
    } catch {
      area.current?.select();
      setState("fail");
    }
  }
  return (
    <div className="grid gap-3">
      <label htmlFor="brief-text" className="sr-only">Текст брифа</label>
      <textarea id="brief-text" ref={area} readOnly rows={12} value={text} className={`${field} mt-0 text-[13px]`} />
      <button type="button" onClick={copy} className={btnOutline}>Скопировать бриф</button>
      <p role="status" className="text-[13px]">
        {state === "ok" ? <span className="font-medium text-new-text">Бриф скопирован</span> : null}
        {state === "fail" ? <span className="text-muted">Выделите текст и скопируйте вручную (Ctrl+C)</span> : null}
      </p>
    </div>
  );
}

export function BriefForm() {
  const [d, setD] = useState<BriefData>(INITIAL);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<ReturnType<typeof buildBrief> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function set<K extends keyof BriefData>(k: K, v: BriefData[K]) {
    setD((p) => ({ ...p, [k]: v }));
    setErrors((p) => (p[k] ? { ...p, [k]: undefined } : p));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const clean = { ...d, company: d.company.trim(), name: d.name.trim(), qty: d.qty.trim(), idea: d.idea.trim(), occasion: d.occasion.trim() };
    const errs = validate(clean, consent);
    setErrors(errs);
    const first = ORDER.find((k) => errs[k]);
    if (first) {
      const id = first === "consent" ? "b-consent" : first === "kinds" ? "b-kinds" : `b-${first}`;
      (document.getElementById(id) as HTMLElement | null)?.focus();
      return;
    }
    const built = buildBrief(clean);
    setDone(built);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (built.href) window.location.href = built.href;
  }

  if (done) {
    return (
      <div className="rounded-[14px] bg-surface p-5 md:p-8" role="status">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={32} className="shrink-0 text-new-text" aria-hidden="true" />
          <h2 className="text-[22px] font-bold md:text-[26px]">Бриф готов к отправке</h2>
        </div>
        <p className="mt-3 max-w-[60ch] text-[15px] text-muted">
          {done.href
            ? "Мы открыли письмо в вашей почтовой программе — проверьте и отправьте его. Если письмо не открылось, нажмите кнопку ниже или скопируйте бриф и пришлите на "
            : "Бриф получился длинным для автоматического письма — скопируйте его и пришлите на "}
          <a href={`mailto:${site.email}`} className="font-medium text-ink hover:text-brand">{site.email}</a>
          . Файлы и примеры можно приложить к письму.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {done.href ? <a href={done.href} className={btnPrimary}>Открыть письмо</a> : null}
          <button type="button" onClick={() => setDone(null)} className={btnOutline}>Изменить бриф</button>
        </div>
        <div className="mt-6 max-w-[720px]"><CopyBlock text={done.text} /></div>
      </div>
    );
  }

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="grid gap-5">
      <Card n={1} title="Контакты">
        <Field name="company" label="Компания" required error={errors.company}>
          {(p) => <input {...p} type="text" autoComplete="organization" value={d.company} onChange={(e) => set("company", e.target.value)} className={field} />}
        </Field>
        <Field name="name" label="Контактное лицо" required error={errors.name}>
          {(p) => <input {...p} type="text" autoComplete="name" value={d.name} onChange={(e) => set("name", e.target.value)} className={field} />}
        </Field>
        <Field name="phone" label="Телефон" required error={errors.phone}>
          {(p) => <PhoneInput {...p} value={d.phone} onValueChange={(v) => set("phone", v)} className={field} />}
        </Field>
        <Field name="email" label="Email" error={errors.email}>
          {(p) => <input {...p} type="email" autoComplete="email" value={d.email} onChange={(e) => set("email", e.target.value)} className={field} />}
        </Field>
        <Field name="city" label="Город">
          {(p) => (
            <select {...p} value={d.city} onChange={(e) => set("city", e.target.value)} className={field}>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          )}
        </Field>
      </Card>

      <Card n={2} title="Задача">
        <Chips id="b-kinds" legend="Что нужно изготовить" required options={KINDS} value={d.kinds} onChange={(v) => set("kinds", v)} error={errors.kinds} />
        <Field name="qty" label="Тираж" required error={errors.qty}>
          {(p) => <input {...p} type="text" inputMode="numeric" placeholder="Например, 300 шт." value={d.qty} onChange={(e) => set("qty", e.target.value)} className={field} />}
        </Field>
        <Field name="budget" label="Бюджет">
          {(p) => (
            <select {...p} value={d.budget} onChange={(e) => set("budget", e.target.value)} className={field}>
              <option value="">Не выбран</option>
              {BUDGETS.map((b) => <option key={b}>{b}</option>)}
            </select>
          )}
        </Field>
        <Field name="deadline" label="Срок готовности">
          {(p) => <input {...p} type="date" value={d.deadline} onChange={(e) => set("deadline", e.target.value)} className={field} />}
        </Field>
        <Field name="occasion" label="Повод / мероприятие">
          {(p) => <input {...p} type="text" value={d.occasion} onChange={(e) => set("occasion", e.target.value)} className={field} />}
        </Field>
      </Card>

      <Card n={3} title="Детали">
        <Field name="idea" label="Описание идеи" required wide error={errors.idea}>
          {(p) => <textarea {...p} rows={5} placeholder="Для кого изделие, что должно быть в комплекте, какие материалы и цвета предпочтительны" value={d.idea} onChange={(e) => set("idea", e.target.value)} className={field} />}
        </Field>
        <Chips id="b-prints" legend="Пожелания по брендированию (виды нанесения)" options={applications.items.map((a) => a.title)} value={d.prints} onChange={(v) => set("prints", v)} />
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium text-ink">Есть ли брендбук / логотип</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {BRANDBOOK.map((o) => (
              <label key={o} className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border bg-white px-4 text-[14px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${d.brandbook === o ? "border-brand font-medium text-brand" : "border-line text-ink"}`}>
                <input type="radio" name="brandbook" value={o} checked={d.brandbook === o} onChange={() => set("brandbook", o)} className="size-4 accent-[#D02E31]" />
                {o}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="text-[13px] text-muted sm:col-span-2">Файлы и примеры можно приложить к письму после отправки.</p>
      </Card>

      <section aria-label="Согласие и отправка" className="rounded-[14px] bg-surface p-5 md:p-6">
        <label className="flex items-start gap-2.5 text-[13px] text-muted">
          <input
            id="b-consent"
            type="checkbox"
            checked={consent}
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? "b-consent-err" : undefined}
            onChange={(e) => {
              setConsent(e.target.checked);
              setErrors((p) => ({ ...p, consent: undefined }));
            }}
            className="mt-0.5 size-4 shrink-0 accent-[#D02E31] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          />
          <span>
            Согласен на обработку{" "}
            <Link href="/personal-data-processing" className="text-brand underline hover:text-brand-hover">персональных данных</Link>{" "}
            <span className="text-brand">*</span>
          </span>
        </label>
        {errors.consent ? <p id="b-consent-err" className="mt-1.5 text-[13px] text-brand">{errors.consent}</p> : null}
        <button type="submit" className={`${btnPrimary} mt-5 w-full sm:w-auto`}>Отправить бриф</button>
      </section>
    </form>
  );
}
