import type { ReactNode } from "react";
import { ClipboardList, Heart, History, Zap } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SignedInNotice } from "./signed-in-notice";

const PERKS = [
  { Icon: Zap, title: "Быстрое оформление", text: "Контакты и реквизиты компании подставляются в заказ автоматически" },
  { Icon: History, title: "История заказов", text: "Все отправленные заявки в одном месте, повтор заказа в один клик" },
  { Icon: Heart, title: "Избранное", text: "Сохраняйте товары и возвращайтесь к подборке позже" },
  { Icon: ClipboardList, title: "Персональный менеджер", text: "Подбор сувениров и расчёт нанесения под ваш тираж" },
];

export function AuthLayout({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Личный кабинет", href: "/account" }, { label: title }]} />
      </Container>
      <Container className="grid items-start gap-6 py-6 md:py-10 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-10">
        <section aria-labelledby="auth-title" className="rounded-[14px] border border-line bg-white p-5 md:p-8">
          <h1 id="auth-title" className="text-[28px] font-bold leading-tight tracking-tight md:text-[34px]">{title}</h1>
          <p className="mt-2 text-[14px] text-muted">{lead}</p>
          <div className="mt-6">
            <SignedInNotice>{children}</SignedInNotice>
          </div>
        </section>
        <aside aria-label="Возможности кабинета" className="rounded-[14px] bg-surface p-5 md:p-8">
          <h2 className="text-[20px] font-bold">Что даёт личный кабинет</h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {PERKS.map(({ Icon, title: t, text }) => (
              <li key={t} className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold">{t}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-line pt-4 text-[12px] text-muted">
            Кабинет пока хранится в этом браузере — на другом устройстве войдите заново после регистрации там.
          </p>
        </aside>
      </Container>
    </main>
  );
}
