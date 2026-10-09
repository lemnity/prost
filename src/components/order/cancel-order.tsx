"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { api } from "@/lib/account/store";
import { formatPriceValue } from "@/lib/format";
import { site } from "@/content/site";

type Info = { number: string; status: string; total: number };

/** Подтверждение отмены заказа по ссылке из письма. */
export function CancelOrder() {
  const params = useSearchParams();
  const n = params.get("n") ?? "";
  const t = params.get("t") ?? "";
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void api<Info>(`/api/orders/cancel?n=${encodeURIComponent(n)}&t=${encodeURIComponent(t)}`, { cache: "no-store" }).then((r) => {
      if (!alive) return;
      if (r.ok) setInfo(r.data);
      else setError(r.error);
    });
    return () => {
      alive = false;
    };
  }, [n, t]);

  async function cancel() {
    setBusy(true);
    const r = await api<{ status: string }>("/api/orders/cancel", { method: "POST", body: JSON.stringify({ number: n, token: t }) });
    setBusy(false);
    if (r.ok && info) setInfo({ ...info, status: "cancelled" });
    else if (!r.ok) setError(r.error);
  }

  const box = "mx-auto max-w-[520px] rounded-[14px] border border-line bg-white p-6 text-center md:p-8";
  if (error) {
    return (
      <div className={box} role="alert">
        <XCircle size={40} strokeWidth={1.5} aria-hidden="true" className="mx-auto text-brand" />
        <h1 className="mt-3 text-[22px] font-bold">{error}</h1>
        <p className="mt-2 text-[14px] text-muted">Позвоните нам: <a href={site.phone.href} className="font-semibold text-ink">{site.phone.label}</a></p>
      </div>
    );
  }
  if (!info) return <div aria-busy="true" className="mx-auto h-[260px] max-w-[520px] animate-pulse rounded-[14px] bg-surface" />;
  if (info.status === "cancelled") {
    return (
      <div className={box} role="status">
        <CheckCircle2 size={40} strokeWidth={1.5} aria-hidden="true" className="mx-auto text-new-text" />
        <h1 className="mt-3 text-[22px] font-bold">Заказ № {info.number} отменён</h1>
        <p className="mt-2 text-[14px] text-muted">Менеджер получил уведомление. Если передумаете — оформите заказ заново или напишите нам.</p>
        <Link href="/catalog" className={`${buttonClass({ size: "lg" })} mt-5`}>Перейти в каталог</Link>
      </div>
    );
  }
  return (
    <div className={box}>
      <h1 className="text-[24px] font-bold">Отменить заказ № {info.number}?</h1>
      <p className="mt-2 text-[15px] text-muted">Сумма заказа: от {formatPriceValue(info.total)}. После отмены менеджер прекратит работу над заказом.</p>
      {info.status === "done" ? (
        <p className="mt-4 text-[14px] text-brand">Заказ уже выполнен — отменить его нельзя. Свяжитесь с менеджером.</p>
      ) : (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={cancel} disabled={busy} className={buttonClass({ size: "lg" })}>
            {busy ? "Отменяем…" : "Да, отменить заказ"}
          </button>
          <Link href={`/account/chat?order=${encodeURIComponent(info.number)}`} className={buttonClass({ variant: "outline", size: "lg" })}>
            Не отменять
          </Link>
        </div>
      )}
    </div>
  );
}
