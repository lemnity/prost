"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/account/store";

type Lead = { id: number; kind: string; status: string; date: string; data: Record<string, string> };
const KIND: Record<string, string> = { brief: "Бриф", callback: "Обратный звонок", contact: "Сообщение" };

export function AdminLeads() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const r = await api<{ leads: Lead[] }>("/api/admin/leads", { cache: "no-store" });
    if (r.ok) setLeads(r.data.leads);
    else setError(r.error);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- загрузка с сервера: setState после await
    void load();
  }, [load]);

  async function mark(id: number, status: string) {
    await api("/api/admin/leads", { method: "PATCH", body: JSON.stringify({ id, status }) });
    await load();
  }

  if (error) return <p role="alert" className="text-brand">{error}</p>;
  if (!leads) return <div aria-busy="true" className="h-[300px] animate-pulse rounded-[14px] bg-surface" />;
  if (!leads.length) return <p className="rounded-[14px] bg-surface p-8 text-center text-muted">Обращений пока нет</p>;
  return (
    <ul className="grid gap-3">
      {leads.map((l) => (
        <li key={l.id} className={`rounded-[14px] border bg-white p-4 ${l.status === "new" ? "border-brand" : "border-line"}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[12px] font-semibold text-brand">{KIND[l.kind] ?? l.kind}</span>
            <span className="text-[13px] text-muted">{new Date(l.date).toLocaleString("ru-RU")}</span>
            <button
              type="button"
              onClick={() => void mark(l.id, l.status === "new" ? "done" : "new")}
              className="ml-auto text-[13px] font-medium text-muted underline hover:text-brand"
            >
              {l.status === "new" ? "Отметить обработанным" : "Вернуть в новые"}
            </button>
          </div>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-[14px] leading-relaxed">{l.data.text}</pre>
        </li>
      ))}
    </ul>
  );
}
