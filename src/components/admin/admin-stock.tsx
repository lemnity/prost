"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { buttonClass, selectClass } from "@/components/ui/button";
import { api } from "@/lib/account/store";

type Run = {
  last: { startedAt: string; finishedAt: string | null; items: number; error: string | null } | null;
  lastSuccessAt: string | null;
};
type Counts = { total: number; active: number; inStock: number };
type SectionRun = { category: number; name: string; startedAt: string; finishedAt: string | null; items: number; error: string | null };
type Status = {
  stock: Run;
  catalog: Run;
  giftsStock: Run;
  giftsCatalog: Run;
  sections: SectionRun[];
  bySupplier: Record<string, Counts>;
};
type Kind = "oasis-stock" | "oasis-catalog" | "gifts-stock" | "gifts-catalog" | "section";
type Cat = { id: number; parent: number | null; root: number | null; level: number; name: string; count: number };

const PRODUCTS_ROOT = 2891;
const HOLIDAYS_ROOT = 2269;
const dt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("ru-RU") : "—");
const n = (v: number) => v.toLocaleString("ru-RU");
const running = (r: { finishedAt: string | null } | null | undefined) => !!r && !r.finishedAt;

/** Склад в админке: синхронизация Oasis и gifts.ru и ручная подгрузка раздела каталога. */
export function AdminStock() {
  const [s, setS] = useState<Status | null>(null);
  const [cats, setCats] = useState<Cat[]>([]);
  const [top, setTop] = useState("");
  const [sub, setSub] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await api<Status>("/api/admin/stock", { cache: "no-store" });
    if (r.ok) setS(r.data);
    else setMsg(r.error);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- загрузка с сервера: setState после await
    void load();
    void fetch("/api/catalog/tree")
      .then((r) => r.json())
      .then((d: { categories: Cat[] }) => setCats(d.categories ?? []))
      .catch(() => {});
  }, [load]);

  // Пока что-то обновляется — опрашиваем статус каждые 4 секунды.
  const busy = !!s && [s.stock.last, s.catalog.last, s.giftsStock.last, s.giftsCatalog.last, ...s.sections].some(running);
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => void load(), 4000);
    return () => clearInterval(id);
  }, [busy, load]);

  const tops = useMemo(() => cats.filter((c) => c.count > 0 && (c.parent === PRODUCTS_ROOT || c.id === HOLIDAYS_ROOT)), [cats]);
  const subs = useMemo(() => cats.filter((c) => c.count > 0 && String(c.parent) === top), [cats, top]);

  async function run(kind: Kind, category?: number) {
    setMsg("");
    const r = await api<{ started: boolean }>("/api/admin/stock/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, category }),
    });
    setMsg(r.ok ? "Запущено — статус обновится сам" : r.error);
    setTimeout(() => void load(), 1200);
  }

  if (!s) return <div aria-busy="true" className="h-[220px] animate-pulse rounded-[14px] bg-surface" />;
  const card = "rounded-[14px] border border-line bg-white p-5";

  const runCard = (title: string, note: string, r: Run, kind: Kind, primary = false) => {
    const failed = !!r.last?.error;
    const now = running(r.last);
    return (
      <div className={card}>
        <h3 className="text-[16px] font-semibold">{title}</h3>
        <dl className="mt-3 grid gap-2 text-[14px]">
          <div><dt className="text-[12px] text-muted">Последнее успешное обновление</dt><dd>{dt(r.lastSuccessAt)}</dd></div>
          <div>
            <dt className="text-[12px] text-muted">Последний запуск</dt>
            <dd className={failed ? "text-brand" : ""}>
              {r.last ? `${dt(r.last.startedAt)} — ${now ? "идёт…" : failed ? `ошибка: ${r.last.error}` : `${n(r.last.items)} товаров`}` : "ещё не запускалась"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-[13px] text-muted">{note}</p>
        <button type="button" onClick={() => void run(kind)} disabled={now} className={`${buttonClass({ variant: primary ? "primary" : "outline", size: "sm" })} mt-4`}>
          <RefreshCw size={15} aria-hidden="true" className={now ? "motion-safe:animate-spin" : ""} /> {now ? "Обновляется…" : "Обновить сейчас"}
        </button>
      </div>
    );
  };

  const supplierStat = (label: string, c?: Counts) => (
    <div className={card}>
      <p className="text-[13px] font-semibold">{label}</p>
      <dl className="mt-2 grid grid-cols-3 gap-2">
        <div><dt className="text-[12px] text-muted">Всего</dt><dd className="text-[20px] font-bold tabular-nums">{n(c?.total ?? 0)}</dd></div>
        <div><dt className="text-[12px] text-muted">Активных</dt><dd className="text-[20px] font-bold tabular-nums">{n(c?.active ?? 0)}</dd></div>
        <div><dt className="text-[12px] text-muted">В наличии</dt><dd className="text-[20px] font-bold tabular-nums">{n(c?.inStock ?? 0)}</dd></div>
      </dl>
    </div>
  );

  const chosen = Number(sub || top) || 0;
  const chosenName = cats.find((c) => c.id === chosen)?.name ?? "";
  const sectionBusy = s.sections.some((x) => x.category === chosen && running(x));

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 md:grid-cols-2">
        {supplierStat("Склад Oasis", s.bySupplier.oasis)}
        {supplierStat("Склад gifts.ru", s.bySupplier.gifts)}
      </div>

      <section className={card} aria-labelledby="section-sync">
        <h2 id="section-sync" className="text-[17px] font-semibold">Подгрузить раздел вручную</h2>
        <p className="mt-1 text-[13px] text-muted">
          Обновляет товары выбранного раздела со склада Oasis целиком: цены, остатки, описания, фото и разделы. Раздел с подразделами — все вложенные.
          Склад gifts.ru отдаёт выгрузку только целиком — его обновляйте кнопками ниже.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="grid min-w-[240px] flex-1 gap-1.5 text-[13px] font-semibold">
            Раздел
            <select value={top} onChange={(e) => { setTop(e.target.value); setSub(""); }} className={selectClass({ size: "sm" })}>
              <option value="">— выберите раздел —</option>
              {tops.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({n(c.count)})</option>
              ))}
            </select>
          </label>
          <label className="grid min-w-[240px] flex-1 gap-1.5 text-[13px] font-semibold">
            Подраздел
            <select value={sub} onChange={(e) => setSub(e.target.value)} disabled={!subs.length} className={selectClass({ size: "sm" })}>
              <option value="">Весь раздел</option>
              {subs.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({n(c.count)})</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => void run("section", chosen)} disabled={!chosen || sectionBusy} className={buttonClass({ size: "sm" })}>
            <RefreshCw size={15} aria-hidden="true" className={sectionBusy ? "motion-safe:animate-spin" : ""} />
            {sectionBusy ? "Подгружается…" : chosenName ? `Подгрузить «${chosenName}»` : "Подгрузить раздел"}
          </button>
        </div>
        {s.sections.length ? (
          <div className="mt-5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Последние подгрузки</p>
            <ul className="mt-2 divide-y divide-line text-[14px]">
              {s.sections.map((x) => (
                <li key={`${x.category}-${x.startedAt}`} className="flex flex-wrap justify-between gap-2 py-2">
                  <span className="font-medium">{x.name || `Раздел ${x.category}`}</span>
                  <span className={x.error ? "text-brand" : "text-muted"}>
                    {dt(x.startedAt)} — {running(x) ? "идёт…" : x.error ? `ошибка: ${x.error}` : `${n(x.items)} товаров`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {runCard("Oasis — цены и остатки", "Автоматически каждый час.", s.stock, "oasis-stock", true)}
        {runCard("Oasis — каталог целиком", "Автоматически каждую ночь в 03:30. Около 3 минут.", s.catalog, "oasis-catalog")}
        {runCard("gifts.ru — цены и остатки", "Автоматически каждый час в :20.", s.giftsStock, "gifts-stock", true)}
        {runCard("gifts.ru — каталог целиком", "Автоматически каждую ночь в 04:30. Около 3 минут.", s.giftsCatalog, "gifts-catalog")}
      </div>
      {msg ? <p role="status" className="text-[14px]">{msg}</p> : null}
    </div>
  );
}
