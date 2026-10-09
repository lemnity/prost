"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { api } from "@/lib/account/store";

type Status = {
  last: { startedAt: string; finishedAt: string | null; items: number; error: string | null } | null;
  lastSuccessAt: string | null;
  total: number;
  active: number;
  inStock: number;
};

const dt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("ru-RU") : "—");

export function AdminStock() {
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    const r = await api<Status>("/api/admin/stock", { cache: "no-store" });
    if (r.ok) setS(r.data);
    else setMsg(r.error);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- загрузка с сервера: setState после await
    void load();
  }, [load]);

  async function sync() {
    setBusy(true);
    setMsg("");
    const r = await api<{ items: number }>("/api/internal/oasis-sync", { method: "POST" });
    setBusy(false);
    setMsg(r.ok ? `Готово: обновлено ${r.data.items.toLocaleString("ru-RU")} товаров` : r.error);
    await load();
  }

  if (!s) return <div aria-busy="true" className="h-[220px] animate-pulse rounded-[14px] bg-surface" />;
  const failed = !!s.last?.error;
  const card = "rounded-[14px] border border-line bg-white p-5";
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={card}><p className="text-[13px] text-muted">Товаров в Oasis</p><p className="mt-1 text-[26px] font-bold tabular-nums">{s.total.toLocaleString("ru-RU")}</p></div>
        <div className={card}><p className="text-[13px] text-muted">Активных</p><p className="mt-1 text-[26px] font-bold tabular-nums">{s.active.toLocaleString("ru-RU")}</p></div>
        <div className={card}><p className="text-[13px] text-muted">В наличии</p><p className="mt-1 text-[26px] font-bold tabular-nums">{s.inStock.toLocaleString("ru-RU")}</p></div>
      </div>
      <div className={card}>
        <h2 className="text-[17px] font-semibold">Склад Oasis</h2>
        <dl className="mt-3 grid gap-2 text-[14px] sm:grid-cols-2">
          <div><dt className="text-[12px] text-muted">Последнее успешное обновление</dt><dd>{dt(s.lastSuccessAt)}</dd></div>
          <div>
            <dt className="text-[12px] text-muted">Последний запуск</dt>
            <dd className={failed ? "text-brand" : ""}>{s.last ? `${dt(s.last.startedAt)} — ${failed ? `ошибка: ${s.last.error}` : s.last.finishedAt ? `${s.last.items.toLocaleString("ru-RU")} товаров` : "идёт…"}` : "ещё не запускалась"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[13px] text-muted">Цены и остатки обновляются автоматически каждый час. Сайт показывает их на страницах товаров и считает заказы по актуальной цене.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={sync} disabled={busy} className={buttonClass()}>
            <RefreshCw size={16} aria-hidden="true" className={busy ? "motion-safe:animate-spin" : ""} /> {busy ? "Обновляем…" : "Обновить сейчас"}
          </button>
          {msg ? <p role="status" className="text-[14px]">{msg}</p> : null}
        </div>
      </div>
    </div>
  );
}
