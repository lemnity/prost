"use client";

import { useState, type FormEvent } from "react";
import { ExternalLink } from "lucide-react";
import { selectClass } from "@/components/ui/button";
import { api } from "@/lib/account/store";
import { CARRIERS, SHIP_STAGES, trackUrl, type CarrierKey, type Shipping, type ShipStage } from "@/lib/shipping";

// Все поля одной высоты (h-10, как selectClass sm) и тянутся по своей колонке — иначе списки наезжают друг на друга.
const input = "h-10 w-full min-w-0 rounded-lg border border-line bg-white px-3 text-[14px] hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand";
const select = `${selectClass({ size: "sm" })} w-full min-w-0`;

/** Доставка заявки для менеджера: этап, перевозчик, трек-номер. «Отправлен» — клиенту уходит письмо. */
export function ShippingEditor({ number, value, onSaved }: { number: string; value?: Shipping; onSaved?: (s: Shipping) => void }) {
  const [stage, setStage] = useState<ShipStage>(value?.stage ?? "prep");
  const [carrier, setCarrier] = useState<CarrierKey | "">(value?.carrier ?? "");
  const [track, setTrack] = useState(value?.track ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const dirty = stage !== (value?.stage ?? "prep") || carrier !== (value?.carrier ?? "") || track.trim() !== (value?.track ?? "");
  const url = trackUrl({ carrier: carrier || undefined, track: track.trim() });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const r = await api<{ shipping: Shipping }>(`/api/admin/orders/${encodeURIComponent(number)}`, {
      method: "PATCH",
      body: JSON.stringify({ shipping: { stage, carrier, track } }),
    });
    setBusy(false);
    if (!r.ok) return setMsg(r.error);
    setMsg(stage === "shipped" && value?.stage !== "shipped" ? "Сохранено, клиенту отправлено письмо" : "Сохранено");
    onSaved?.(r.data.shipping);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-end">
      <label className="grid min-w-0 gap-1 text-[12px] text-muted">
        Этап
        <select value={stage} onChange={(e) => setStage(e.target.value as ShipStage)} className={select}>
          {SHIP_STAGES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </label>
      <label className="grid min-w-0 gap-1 text-[12px] text-muted">
        Перевозчик
        <select value={carrier} onChange={(e) => setCarrier(e.target.value as CarrierKey | "")} className={select}>
          <option value="">Не выбран</option>
          {CARRIERS.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </label>
      <label className="grid min-w-0 gap-1 text-[12px] text-muted">
        Трек-номер
        <input value={track} onChange={(e) => setTrack(e.target.value)} maxLength={60} placeholder="Номер отправления" className={input} />
      </label>
      <button
        type="submit"
        disabled={busy || !dirty}
        className="h-10 whitespace-nowrap rounded-lg bg-ink px-5 text-[14px] font-semibold text-white hover:bg-brand disabled:opacity-40 disabled:hover:bg-ink"
      >
        {busy ? "Сохраняем…" : "Сохранить"}
      </button>
      <p role="status" className="text-[12px] sm:col-span-4">
        {url ? (
          <a href={url} target="_blank" rel="noopener" className="mr-3 inline-flex items-center gap-1 font-medium text-brand hover:text-brand-hover">
            Отследить у перевозчика <ExternalLink size={12} aria-hidden="true" />
          </a>
        ) : null}
        <span className="text-muted">{msg}</span>
      </p>
    </form>
  );
}
