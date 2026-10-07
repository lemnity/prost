"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Copy, MessageCircle, SendHorizontal } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { formatPriceValue, formatQty } from "@/lib/format";
import { plural } from "@/lib/plural";
import { site } from "@/content/site";
import { cartCount, clearCart } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/use-cart";
import { AGENT, agentReply } from "@/lib/chat/agent";
import { appendMessages, messageId, type Chat } from "@/lib/chat/store";
import { useChats, useNow } from "@/lib/chat/use-chats";

const time = (ms: number) => new Date(ms).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

function Avatar({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-brand font-bold text-white ${size === "sm" ? "size-8 text-[13px]" : "size-11 text-[17px]"}`}
    >
      {AGENT.name[0]}
    </span>
  );
}

export function ChatView() {
  const params = useSearchParams();
  const chats = useChats();
  const list = Object.values(chats).sort((a, b) => b.createdAt - a.createdAt);
  const wanted = params.get("order");
  const chat = (wanted && chats[wanted]) || list[0];

  if (!chat) {
    return (
      <div className="flex flex-col items-center rounded-[14px] bg-surface px-5 py-12 text-center">
        <MessageCircle size={36} strokeWidth={1.5} aria-hidden="true" className="text-brand" />
        <h2 className="mt-4 text-[20px] font-bold">Чатов пока нет</h2>
        <p className="mt-2 max-w-md text-sm text-muted">После оформления заявки здесь откроется чат с вашим персональным менеджером.</p>
        <Link href="/catalog" className={`${buttonClass({ size: "lg", px: "px-8" })} mt-6`}>Перейти в каталог</Link>
      </div>
    );
  }
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <ChatWindow key={chat.number} chat={chat} />
      <aside className="grid gap-4">
        <OrderSummary chat={chat} />
        {list.length > 1 ? (
          <nav aria-label="Другие заявки" className="rounded-[14px] bg-surface p-4">
            <h2 className="text-[15px] font-semibold">Ваши заявки</h2>
            <ul className="mt-2 grid gap-1">
              {list.map((c) => (
                <li key={c.number}>
                  <Link
                    href={`/account/chat?order=${encodeURIComponent(c.number)}`}
                    aria-current={c.number === chat.number ? "page" : undefined}
                    className={`flex justify-between gap-2 rounded-lg px-2 py-1.5 text-[13px] ${c.number === chat.number ? "bg-white font-semibold text-brand" : "hover:bg-white"}`}
                  >
                    <span>№ {c.number}</span>
                    <span className="text-muted">{new Date(c.createdAt).toLocaleDateString("ru-RU")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </aside>
    </div>
  );
}

function ChatWindow({ chat }: { chat: Chat }) {
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(false);
  const until = chat.messages.reduce((t, m) => Math.max(t, m.at), 0);
  const now = useNow(until, waiting);
  const visible = chat.messages.filter((m) => m.at <= now);
  const typing = waiting || chat.messages.some((m) => m.at > now);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visible.length, typing]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || waiting) return;
    setDraft("");
    const mine = { id: messageId(), role: "user" as const, text, at: Date.now() };
    appendMessages(chat.number, [mine]);
    setWaiting(true);
    const reply = await agentReply({ ...chat, messages: [...chat.messages, mine] }, text);
    appendMessages(chat.number, [reply]);
    setWaiting(false);
  }

  return (
    <section aria-label={`Чат с менеджером по заявке № ${chat.number}`} className="flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-line bg-white">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3 md:px-5">
        <span className="relative">
          <Avatar />
          <span aria-hidden="true" className="absolute bottom-0 right-0 size-3 rounded-full bg-[#3BB273] ring-2 ring-white" />
        </span>
        <div className="min-w-0">
          <p className="text-[16px] font-semibold leading-tight">{AGENT.name}</p>
          <p className="text-[12px] text-muted">{AGENT.role}</p>
        </div>
      </header>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Сообщения"
        className="flex h-[min(60dvh,560px)] flex-col gap-3 overflow-y-auto overscroll-contain bg-surface/60 px-3 py-4 md:px-5"
      >
        <p className="self-center rounded-full bg-white px-3 py-1 text-[12px] text-muted">
          Заявка № {chat.number} · {new Date(chat.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
        </p>
        {visible.map((m) =>
          m.role === "agent" ? (
            <div key={m.id} className="flex max-w-[88%] items-end gap-2 md:max-w-[75%]">
              <Avatar size="sm" />
              <div className="rounded-[14px] rounded-bl-[4px] bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <p className="whitespace-pre-line text-[14px] leading-relaxed">{m.text}</p>
                <p className="mt-1 text-right text-[11px] text-muted">{time(m.at)}</p>
              </div>
            </div>
          ) : (
            <div key={m.id} className="max-w-[88%] self-end rounded-[14px] rounded-br-[4px] bg-brand px-3.5 py-2.5 text-white md:max-w-[75%]">
              <p className="whitespace-pre-line text-[14px] leading-relaxed">{m.text}</p>
              <p className="mt-1 text-right text-[11px] text-white/75">{time(m.at)}</p>
            </div>
          ),
        )}
        {typing ? (
          <div className="flex items-end gap-2">
            <Avatar size="sm" />
            <div className="flex items-center gap-1 rounded-[14px] rounded-bl-[4px] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <span className="sr-only">{AGENT.name} печатает…</span>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  style={{ animationDelay: `${i * 150}ms` }}
                  className="size-1.5 rounded-full bg-muted motion-safe:animate-bounce"
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-3">
        <label htmlFor="chat-input" className="sr-only">Сообщение менеджеру</label>
        <textarea
          id="chat-input"
          rows={1}
          value={draft}
          maxLength={2000}
          placeholder="Напишите сообщение…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send();
            }
          }}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-[10px] border border-line bg-white px-3.5 py-2.5 text-[15px] [field-sizing:content] placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
        />
        <button
          type="submit"
          aria-label="Отправить"
          disabled={!draft.trim() || waiting}
          className={`${buttonClass({ px: "px-0" })} size-11 shrink-0`}
        >
          <SendHorizontal size={18} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

function OrderSummary({ chat }: { chat: Chat }) {
  const cart = useCart();
  const [copied, setCopied] = useState(false);
  const n = cartCount(chat.items);
  return (
    <section aria-labelledby="chat-order" className="rounded-[14px] bg-surface p-4">
      <h2 id="chat-order" className="text-[15px] font-semibold">Заявка № {chat.number}</h2>
      <p className="mt-1 text-[13px] text-muted">
        {chat.items.length} {plural("item", chat.items.length)} · {formatQty(n)} шт.
      </p>
      <p className="mt-2 text-[20px] font-bold">от {formatPriceValue(chat.total)}</p>
      <p className="mt-3 text-[13px] leading-snug text-muted">
        {chat.mailOpened
          ? `Заявка подготовлена в вашем почтовом клиенте для отправки на ${site.email}. Если письмо не ушло — скопируйте текст ниже.`
          : `Скопируйте текст заявки и отправьте на ${site.email} или позвоните ${site.phone.label}.`}
      </p>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(chat.orderText);
            setCopied(true);
          } catch {}
        }}
        className={`${buttonClass({ variant: "outline", size: "sm", full: true })} mt-3`}
      >
        {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
        {copied ? "Текст заявки скопирован" : "Скопировать текст заявки"}
      </button>
      <p role="status" className="sr-only">{copied ? "Текст заявки скопирован" : ""}</p>
      {cart.length ? (
        <button type="button" onClick={() => clearCart()} className="mt-3 w-full text-center text-[13px] font-medium text-muted underline hover:text-brand">
          Очистить корзину
        </button>
      ) : null}
    </section>
  );
}
