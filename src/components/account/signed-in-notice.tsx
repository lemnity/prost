"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/button";
import { fullName, signOut } from "@/lib/account/store";
import { useSession } from "@/lib/account/use-account";

/** На страницах входа/регистрации: если уже вошли — ссылка в кабинет вместо формы. */
export function SignedInNotice({ children }: { children: ReactNode }) {
  const s = useSession();
  if (!s) return <>{children}</>;
  return (
    <div className="rounded-[10px] bg-surface p-5">
      <p className="text-[15px]">
        Вы вошли как <strong>{fullName(s.profile)}</strong> ({s.profile.email}).
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/account" className={buttonClass()}>Перейти в кабинет</Link>
        <button type="button" onClick={signOut} className={buttonClass({ variant: "outline" })}>Выйти</button>
      </div>
    </div>
  );
}
