"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogOut, Package, User, UserRound } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { fullName, isCurrentOrder, signOut } from "@/lib/account/store";
import { useSession } from "@/lib/account/use-account";

/** Иконка кабинета в шапке: по нажатию — меню (кабинет, заявки, выход) или вход/регистрация. */
export function AccountLink({ className }: { className: string }) {
  const s = useSession();
  const [open, setOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const ref = useRef<HTMLDivElement>(null);
  const label = s ? `Личный кабинет: ${fullName(s.profile)}` : "Личный кабинет";
  const current = s ? s.orders.filter((o) => isCurrentOrder(o, now)).length : 0;
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex h-11 items-center gap-2.5 rounded-[10px] px-3 text-[14px] font-medium text-ink hover:bg-surface hover:text-brand";

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={label} title={label} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((v) => !v)} className={className}>
        <span className="relative grid place-items-center">
          <User size={22} aria-hidden />
          {s ? <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 size-2.5 rounded-full bg-[#3BB273] ring-2 ring-navy" /> : null}
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[280px] rounded-[14px] bg-white p-2 text-ink shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
          {s ? (
            <>
              <div className="border-b border-line px-3 pb-2.5 pt-1.5">
                <p className="truncate text-[15px] font-semibold">{fullName(s.profile)}</p>
                <p className="truncate text-[12px] text-muted">{s.profile.email}</p>
              </div>
              <ul className="mt-1 grid gap-0.5">
                <li>
                  <Link href="/account/profile" onClick={close} className={item}>
                    <UserRound size={18} aria-hidden="true" /> Личный кабинет
                  </Link>
                </li>
                <li>
                  <Link href="/account" onClick={close} className={item}>
                    <Package size={18} aria-hidden="true" /> Заявки
                    {current ? (
                      <span className="ml-auto rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold tabular-nums text-brand">{current}</span>
                    ) : null}
                  </Link>
                </li>
                <li className="mt-1 border-t border-line pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      signOut();
                    }}
                    className={`${item} w-full text-muted`}
                  >
                    <LogOut size={18} aria-hidden="true" /> Выйти из профиля
                  </button>
                </li>
              </ul>
            </>
          ) : (
            <div className="grid gap-2 p-2">
              <p className="text-[15px] font-semibold">Личный кабинет</p>
              <p className="text-[13px] leading-snug text-muted">Заявки, избранное и данные компании — в одном месте.</p>
              <Link href="/account/login" onClick={close} className={`${buttonClass({ full: true })} mt-1`}>
                Войти
              </Link>
              <Link href="/account/register" onClick={close} className={buttonClass({ variant: "outline", full: true })}>
                Регистрация
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
