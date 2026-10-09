"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, Paperclip, SendHorizontal, X } from "lucide-react";
import { buttonClass, selectClass } from "@/components/ui/button";
import { formatPriceValue } from "@/lib/format";
import { asset } from "@/lib/asset";
import { api } from "@/lib/account/store";
import { AGENT } from "@/lib/chat/agent";
import { formatSize, isImage, type ChatMessage } from "@/lib/chat/types";
import type { CartItem } from "@/lib/cart/store";

type AdminOrder = {
  number: string;
  status: string;
  date: string;
  total: number;
  items: CartItem[];
  delivery: string;
  payment: string;
  address?: string;
  contact: { name: string; phone: string; email: string; company: string; inn: string };
  comment: string;
  promo: string;
  orderText: string;
  userId: number | null;
  unanswered?: number;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "Новая", cls: "bg-brand-soft text-brand" },
  work: { label: "В работе", cls: "bg-amber-100 text-amber-800" },
  done: { label: "Выполнена", cls: "bg-new-bg text-new-text" },
  cancelled: { label: "Отменена", cls: "bg-surface text-muted" },
};
const FILTERS = [{ value: "", label: "Все" }, ...Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))];

const dt = (iso: string | number) => new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const fileUrl = (id: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/files/${id}`;

export function AdminOrders() {
  const params = useSearchParams();
  const selected = params.get("order");
  const [filter, setFilter] = useState("");
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await api<{ orders: AdminOrder[] }>(`/api/admin/orders${filter ? `?status=${filter}` : ""}`, { cache: "no-store" });
    if (r.ok) {
      setOrders(r.data.orders);
      setError("");
    } else setError(r.error);
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- загрузка с сервера: setState после await
    void load();
    const id = setInterval(() => document.visibilityState === "visible" && void load(), 15000);
    return () => clearInterval(id);
  }, [load]);

  if (selected) return <OrderDetail number={selected} onChanged={load} />;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`h-9 rounded-full border px-4 text-[13px] font-medium ${filter === f.value ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-brand"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {error ? <p role="alert" className="mt-4 text-brand">{error}</p> : null}
      {!orders ? (
        <div aria-busy="true" className="mt-4 h-[300px] animate-pulse rounded-[14px] bg-surface" />
      ) : !orders.length ? (
        <p className="mt-6 rounded-[14px] bg-surface p-8 text-center text-muted">Заявок нет</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-[14px] border border-line">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead className="bg-surface text-[12px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Заявка</th>
                <th className="px-4 py-3 font-semibold">Клиент</th>
                <th className="px-4 py-3 font-semibold">Сумма</th>
                <th className="px-4 py-3 font-semibold">Получение</th>
                <th className="px-4 py-3 font-semibold">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.number} className="hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin?order=${encodeURIComponent(o.number)}`} className="font-semibold text-ink hover:text-brand">
                      {o.number}
                    </Link>
                    <span className="block text-[12px] text-muted">{dt(o.date)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {o.contact.company || o.contact.name}
                    <span className="block text-[12px] text-muted">{o.contact.phone}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{formatPriceValue(o.total)}</td>
                  <td className="px-4 py-3 text-[13px]">{o.delivery}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${STATUS[o.status]?.cls ?? ""}`}>{STATUS[o.status]?.label ?? o.status}</span>
                    {o.unanswered ? (
                      <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white" title="Сообщения клиента без ответа менеджера">
                        {o.unanswered} в чате
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrderDetail({ number, onChanged }: { number: string; onChanged: () => void }) {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const r = await api<{ order: AdminOrder; messages: ChatMessage[]; now: number }>(`/api/admin/orders/${encodeURIComponent(number)}`, { cache: "no-store" });
    if (!r.ok) return setError(r.error);
    setOrder(r.data.order);
    // Отложенные ответы бота показываем сразу — менеджеру нужен полный контекст.
    setMessages(r.data.messages);
  }, [number]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- загрузка с сервера: setState после await
    void load();
    const id = setInterval(() => document.visibilityState === "visible" && void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages.length]);

  async function setStatus(status: string) {
    await api(`/api/admin/orders/${encodeURIComponent(number)}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
    onChanged();
  }

  async function reply(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() && !files.length) return;
    setBusy(true);
    const body = new FormData();
    body.append("text", text.trim());
    files.forEach((f) => body.append("files", f, f.name));
    const r = await api(`/api/admin/chat/${encodeURIComponent(number)}`, { method: "POST", body });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setText("");
    setFiles([]);
    await load();
  }

  if (error && !order) return <p role="alert" className="text-brand">{error}</p>;
  if (!order) return <div aria-busy="true" className="h-[400px] animate-pulse rounded-[14px] bg-surface" />;
  const c = order.contact;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid gap-4">
        <Link href="/admin" className="inline-flex items-center gap-1 text-[14px] font-medium text-muted hover:text-brand">
          <ChevronLeft size={16} aria-hidden="true" /> Все заявки
        </Link>
        <div className="rounded-[14px] border border-line bg-white p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="mr-auto text-[22px] font-bold">Заявка {order.number}</h2>
            <label className="flex items-center gap-2 text-[13px] text-muted">
              Статус
              <select value={order.status} onChange={(e) => void setStatus(e.target.value)} className={selectClass({ size: "sm" })}>
                {Object.entries(STATUS).map(([v, s]) => (
                  <option key={v} value={v}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-1 text-[13px] text-muted">{dt(order.date)} · {order.userId ? "клиент с кабинетом" : "гость"}</p>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-[14px] sm:grid-cols-2">
            <div><dt className="text-[12px] text-muted">Контакт</dt><dd className="font-medium">{c.name}</dd></div>
            <div><dt className="text-[12px] text-muted">Телефон</dt><dd><a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="font-medium hover:text-brand">{c.phone}</a></dd></div>
            {c.email ? <div><dt className="text-[12px] text-muted">Email</dt><dd><a href={`mailto:${c.email}`} className="hover:text-brand">{c.email}</a></dd></div> : null}
            {c.company ? <div><dt className="text-[12px] text-muted">Компания</dt><dd>{c.company}{c.inn ? `, ИНН ${c.inn}` : ""}</dd></div> : null}
            <div><dt className="text-[12px] text-muted">Получение</dt><dd>{order.delivery}{order.address ? ` — ${order.address}` : ""}</dd></div>
            <div><dt className="text-[12px] text-muted">Оплата</dt><dd>{order.payment}</dd></div>
            {order.promo ? <div><dt className="text-[12px] text-muted">Промокод</dt><dd>{order.promo}</dd></div> : null}
            {order.comment ? <div className="sm:col-span-2"><dt className="text-[12px] text-muted">Комментарий</dt><dd className="whitespace-pre-line">{order.comment}</dd></div> : null}
          </dl>
        </div>
        <div className="rounded-[14px] border border-line bg-white p-5">
          <h3 className="text-[16px] font-semibold">Состав · {formatPriceValue(order.total)}</h3>
          <ul className="mt-3 divide-y divide-line">
            {order.items.map((i) => (
              <li key={i.id} className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                <span className="relative aspect-square overflow-hidden rounded-md bg-surface">
                  <Image src={asset(i.image)} alt="" fill sizes="44px" className="object-contain" unoptimized />
                </span>
                <span className="min-w-0 text-[13px]">
                  <a href={i.url} target="_blank" rel="noopener" className="line-clamp-2 hover:text-brand">{i.title}</a>
                  <span className="text-muted">Арт. {i.sku} · {i.qty} шт × {formatPriceValue(i.price)}{i.preorder ? " · под заказ" : ""}</span>
                </span>
                <span className="text-[14px] font-semibold tabular-nums">{formatPriceValue(i.qty * i.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section aria-label="Чат с клиентом" className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-white lg:sticky lg:top-24">
        <header className="border-b border-line px-4 py-3">
          <p className="text-[15px] font-semibold">Чат с клиентом</p>
          <p className="text-[12px] text-muted">Вы отвечаете как «{AGENT.name}». Бот молчит 30 минут после вашего ответа.</p>
        </header>
        <div ref={logRef} className="flex h-[460px] flex-col gap-2.5 overflow-y-auto bg-surface/60 p-3">
          {messages.map((m) => {
            const mine = m.role !== "user";
            return (
              <div key={m.id} className={`max-w-[88%] rounded-[12px] px-3 py-2 text-[13px] ${mine ? "self-start bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "self-end bg-brand text-white"}`}>
                <p className={`mb-0.5 text-[11px] font-semibold ${mine ? "text-muted" : "text-white/80"}`}>
                  {m.role === "user" ? "Клиент" : m.role === "manager" ? "Менеджер" : "Бот"} · {dt(m.at)}
                </p>
                {m.files?.length ? (
                  <ul className="mb-1 grid gap-1">
                    {m.files.map((f) => (
                      <li key={f.id}>
                        <a href={fileUrl(f.id)} target="_blank" rel="noopener" className="underline">
                          {isImage(f) ? "🖼 " : "📎 "}{f.name} ({formatSize(f.size)})
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {m.text ? <p className="whitespace-pre-line leading-relaxed">{m.text}</p> : null}
              </div>
            );
          })}
        </div>
        <form onSubmit={reply} className="border-t border-line p-3">
          {files.length ? (
            <ul className="mb-2 flex flex-wrap gap-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-1 rounded-full bg-surface py-1 pl-3 pr-1 text-[12px]">
                  {f.name}
                  <button type="button" aria-label={`Убрать ${f.name}`} onClick={() => setFiles((l) => l.filter((_, j) => j !== i))} className="grid size-5 place-items-center rounded-full hover:bg-white">
                    <X size={12} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {error ? <p role="alert" className="mb-2 text-[13px] text-brand">{error}</p> : null}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            aria-label="Ответ клиенту"
            placeholder="Ответ клиенту…"
            className="block w-full resize-y rounded-[10px] border border-line px-3 py-2 text-[14px] focus-visible:outline-2 focus-visible:outline-brand"
          />
          <div className="mt-2 flex items-center gap-2">
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { setFiles((l) => [...l, ...Array.from(e.target.files ?? [])].slice(0, 10)); e.target.value = ""; }} />
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-line px-3 text-[13px] hover:border-brand">
              <Paperclip size={15} aria-hidden="true" /> Файл
            </button>
            <button type="submit" disabled={busy} className={`${buttonClass({ size: "md" })} ml-auto`}>
              <SendHorizontal size={16} aria-hidden="true" /> {busy ? "Отправляем…" : "Ответить"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
