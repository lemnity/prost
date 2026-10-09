"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { api } from "@/lib/account/store";

type Run = {
  last: { startedAt: string; finishedAt: string | null; items: number; error: string | null } | null;
  lastSuccessAt: string | null;
};
type Status = {
  stock: Run;
  catalog: Run;
  total: number;
  active: number;
  inStock: number;
};

const dt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("ru-RU") : "—");

export function AdminStock() {
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState<"" | "stock" | "catalog">("");
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

  async function sync(kind: "stock" | "catalog") {
    setBusy(kind);
    setMsg("");
    const r = await api<{ items: number }>(`/api/internal/oasis-sync${kind === "catalog" ? "?kind=catalog" : ""}`, { method: "POST" });
    setBusy("");
    setMsg(r.ok ? `Готово: обработано ${r.data.items.toLocaleString("ru-RU")} товаров` : r.error);
    await load();
  }

  if (!s) return <div aria-busy="true" className="h-[220px] animate-pulse rounded-[14px] bg-surface" />;
  const card = "rounded-[14px] border border-line bg-white p-5";
  const run = (title: string, note: string, r: Run, kind: "stock" | "catalog") => {
    const failed = !!r.last?.error;
    return (
      <div className={card}>
        <h2 className="text-[17px] font-semibold">{title}</h2>
        <dl className="mt-3 grid gap-2 text-[14px] sm:grid-cols-2">
          <div><dt className="text-[12px] text-muted">Последнее успешное обновление</dt><dd>{dt(r.lastSuccessAt)}</dd></div>
          <div>
            <dt className="text-[12px] text-muted">Последний запуск</dt>
            <dd className={failed ? "text-brand" : ""}>{r.last ? `${dt(r.last.startedAt)} — ${failed ? `ошибка: ${r.last.error}` : r.last.finishedAt ? `${r.last.items.toLocaleString("ru-RU")} товаров` : "идёт…"}` : "ещё не запускалась"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[13px] text-muted">{note}</p>
        <button type="button" onClick={() => void sync(kind)} disabled={!!busy} className={`${buttonClass({ variant: kind === "stock" ? "primary" : "outline" })} mt-4`}>
          <RefreshCw size={16} aria-hidden="true" className={busy === kind ? "motion-safe:animate-spin" : ""} /> {busy === kind ? "Обновляем…" : "Обновить сейчас"}
        </button>
      </div>
    );
  };
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={card}><p className="text-[13px] text-muted">Товаров в Oasis</p><p className="mt-1 text-[26px] font-bold tabular-nums">{s.total.toLocaleString("ru-RU")}</p></div>
        <div className={card}><p className="text-[13px] text-muted">Активных</p><p className="mt-1 text-[26px] font-bold tabular-nums">{s.active.toLocaleString("ru-RU")}</p></div>
        <div className={card}><p className="text-[13px] text-muted">В наличии</p><p className="mt-1 text-[26px] font-bold tabular-nums">{s.inStock.toLocaleString("ru-RU")}</p></div>
      </div>
      {run("Цены и остатки", "Обновляются автоматически каждый час: страницы товаров и заказы используют актуальные данные.", s.stock, "stock")}
      {run("Каталог целиком", "Раз в сутки: новые товары, описания, фото, характеристики и разделы. Занимает 2–3 минуты.", s.catalog, "catalog")}
      {msg ? <p role="status" className="text-[14px]">{msg}</p> : null}
    </div>
  );
}
