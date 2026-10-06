"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useSession } from "@/lib/account/use-account";

/** Иконка кабинета в шапке: гостя ведёт на вход, вошедшего — в кабинет (с зелёной точкой). */
export function AccountLink({ className }: { className: string }) {
  const s = useSession();
  const label = s ? `Личный кабинет: ${s.profile.name}` : "Войти в личный кабинет";
  return (
    <Link href={s ? "/account" : "/account/login"} aria-label={label} title={label} className={className}>
      <span className="relative grid place-items-center">
        <User size={22} aria-hidden />
        {s ? (
          <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 size-2.5 rounded-full bg-[#3BB273] ring-2 ring-navy" />
        ) : null}
      </span>
    </Link>
  );
}
