"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, MailWarning } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { refreshSession, resendVerification } from "@/lib/account/store";
import { useSession } from "@/lib/account/use-account";

/** Плашка подтверждения почты в кабинете (и результат перехода по ссылке из письма). */
export function VerifyNotice() {
  const s = useSession();
  const params = useSearchParams();
  const result = params.get("verified");
  const [state, setState] = useState<"" | "sending" | "sent" | string>("");

  if (!s) return null;
  if (result === "1" && s.emailVerified) {
    return (
      <p role="status" className="mb-5 flex items-center gap-2 rounded-[14px] bg-new-bg px-4 py-3 text-[14px] font-medium text-new-text">
        <CheckCircle2 size={18} aria-hidden="true" /> Почта подтверждена. Спасибо!
      </p>
    );
  }
  if (s.emailVerified || s.role === "admin") return null;

  async function resend() {
    setState("sending");
    const r = await resendVerification();
    setState(r.ok ? "sent" : r.error ?? "Не удалось отправить письмо");
    void refreshSession();
  }

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-[14px] border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
      <MailWarning size={24} aria-hidden="true" className="shrink-0 text-amber-700" />
      <p className="text-[14px] sm:flex-1">
        <span className="font-semibold">
          {result === "0" ? "Ссылка устарела или уже использована." : "Подтвердите почту."}
        </span>{" "}
        <span className="text-muted">
          {state === "sent"
            ? `Письмо со ссылкой отправлено на ${s.profile.email}. Проверьте и папку «Спам».`
            : `Мы отправили письмо со ссылкой на ${s.profile.email}.`}
        </span>
        {state && state !== "sending" && state !== "sent" ? <span role="alert" className="block text-brand">{state}</span> : null}
      </p>
      <button type="button" onClick={resend} disabled={state === "sending" || state === "sent"} className={`${buttonClass({ variant: "outline", size: "sm" })} shrink-0`}>
        {state === "sending" ? "Отправляем…" : state === "sent" ? "Отправлено" : "Отправить письмо ещё раз"}
      </button>
    </div>
  );
}
