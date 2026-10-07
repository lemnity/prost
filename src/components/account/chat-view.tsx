"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, ChevronLeft, Copy, Download, MessageCircle, Paperclip, Phone, SendHorizontal, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { asset } from "@/lib/asset";
import { formatPriceValue, formatQty } from "@/lib/format";
import { plural } from "@/lib/plural";
import { site } from "@/content/site";
import { cartCount, clearCart } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/use-cart";
import { AGENT, agentReply } from "@/lib/chat/agent";
import { appendMessages, getChatsSnapshot, messageId, type Chat, type ChatMessage } from "@/lib/chat/store";
import { ACCEPT, MAX_FILES, MAX_FILE_SIZE, extOf, formatSize, isImage, loadFile, saveFiles, type ChatFile } from "@/lib/chat/files";
import { useChats, useNow } from "@/lib/chat/use-chats";

const time = (ms: number) => new Date(ms).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

function Avatar({ size = "md" }: { size?: "sm" | "md" }) {
  const px = size === "sm" ? 32 : 44;
  return (
    <Image
      src={asset(AGENT.photo)}
      alt=""
      width={px}
      height={px}
      className="shrink-0 rounded-full bg-brand-soft object-cover"
      style={{ width: px, height: px }}
    />
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
  const [pending, setPending] = useState<Pending[]>([]);
  const [fileError, setFileError] = useState("");
  const [drag, setDrag] = useState(false);
  const until = chat.messages.reduce((t, m) => Math.max(t, m.at), 0);
  const now = useNow(until, waiting);
  const visible = chat.messages.filter((m) => m.at <= now);
  const typing = waiting || chat.messages.some((m) => m.at > now && (m.typeAt ?? 0) <= now);
  const logRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visible.length, typing]);

  // На телефоне чат — полноэкранное окно: страница под ним не прокручивается.
  useEffect(() => {
    const mq = matchMedia("(max-width: 1023px)");
    const apply = () => {
      document.documentElement.style.overflow = mq.matches ? "hidden" : "";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.style.overflow = "";
    };
  }, []);

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const tooBig = incoming.filter((f) => f.size > MAX_FILE_SIZE);
    const ok = incoming.filter((f) => f.size <= MAX_FILE_SIZE);
    const room = Math.max(0, MAX_FILES - pending.length);
    const added = ok.slice(0, room).map((file) => ({ file, url: isImage(file) ? URL.createObjectURL(file) : null }));
    const dropped = ok.length - added.length;
    setPending([...pending, ...added]);
    setFileError(
      tooBig.length
        ? `Не прикреплено: ${tooBig.map((f) => f.name).join(", ")} — файл больше ${formatSize(MAX_FILE_SIZE)}`
        : dropped > 0
          ? `Можно прикрепить не больше ${MAX_FILES} файлов за раз`
          : "",
    );
  }

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if ((!text && !pending.length) || waiting) return;
    const files = pending.map((p) => p.file);
    pending.forEach((p) => p.url && URL.revokeObjectURL(p.url));
    setDraft("");
    setPending([]);
    setFileError("");
    setWaiting(true);
    let meta: ChatFile[] = [];
    try {
      meta = files.length ? await saveFiles(files) : [];
    } catch {
      setFileError("Не удалось сохранить файлы в браузере — отправьте их на почту");
    }
    const mine: ChatMessage = { id: messageId(), role: "user", text, at: Date.now(), ...(meta.length ? { files: meta } : {}) };
    appendMessages(chat.number, [mine]);
    const reply = await agentReply({ ...chat, messages: [...chat.messages, mine] }, text, files, meta);
    // Ответы идут по очереди: следующий начинает «печататься» после предыдущего.
    const busyUntil = getChatsSnapshot()[chat.number]?.messages.reduce((t, m) => Math.max(t, m.at), 0) ?? 0;
    const shift = Math.max(0, busyUntil + 1200 - (reply.typeAt ?? reply.at));
    appendMessages(chat.number, [{ ...reply, typeAt: (reply.typeAt ?? reply.at) + shift, at: reply.at + shift }]);
    setWaiting(false);
  }

  return (
    <section
      aria-label={`Чат с менеджером по заявке № ${chat.number}`}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDrag(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDrag(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setDrag(false);
        addFiles(e.dataTransfer.files);
      }}
      className={`flex min-w-0 flex-col overflow-hidden bg-white max-lg:fixed max-lg:inset-0 max-lg:z-[60] max-lg:h-[100dvh] lg:relative lg:rounded-[14px] lg:border ${drag ? "lg:border-brand" : "lg:border-line"}`}
    >
      {drag ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-white/85 text-[15px] font-semibold text-brand">
          Отпустите, чтобы прикрепить файлы
        </div>
      ) : null}
      <header className="flex shrink-0 items-center gap-3 border-b border-line px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-5 lg:pt-3">
        <Link href="/account" aria-label="Назад в кабинет" className="-ml-1 grid size-9 shrink-0 place-items-center rounded-full text-ink hover:bg-surface lg:hidden">
          <ChevronLeft size={22} aria-hidden="true" />
        </Link>
        <span className="relative">
          <Avatar />
          <span aria-hidden="true" className="absolute bottom-0 right-0 size-3 rounded-full bg-[#3BB273] ring-2 ring-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold leading-tight">{AGENT.name}</p>
          <p className={`truncate text-[12px] ${typing ? "text-new-text" : "text-muted"}`}>
            {typing ? "печатает…" : `${AGENT.role} · в сети`}
          </p>
        </div>
        <a
          href={site.phone.href}
          aria-label={`Позвонить менеджеру: ${site.phone.label}`}
          className={`${buttonClass({ variant: "outline", size: "sm" })} shrink-0`}
        >
          <Phone size={15} aria-hidden="true" />
          <span className="hidden sm:inline">Позвонить</span>
        </a>
      </header>
      <MobileOrderBar chat={chat} />

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Сообщения"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain bg-surface/60 px-3 py-4 md:px-5 lg:h-[min(60dvh,560px)] lg:flex-none"
      >
        <p className="self-center rounded-full bg-white px-3 py-1 text-[12px] text-muted">
          Заявка № {chat.number} · {new Date(chat.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
        </p>
        {visible.map((m) =>
          m.role === "agent" ? (
            <div key={m.id} className="flex max-w-[88%] items-end gap-2 md:max-w-[75%]">
              <Avatar size="sm" />
              <div className="rounded-[14px] rounded-bl-[4px] bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                {m.files?.length ? <Attachments files={m.files} /> : null}
                {m.text ? <p className="whitespace-pre-line text-[14px] leading-relaxed">{m.text}</p> : null}
                <p className="mt-1 text-right text-[11px] text-muted">{time(m.at)}</p>
              </div>
            </div>
          ) : (
            <div key={m.id} className="max-w-[88%] self-end rounded-[14px] rounded-br-[4px] bg-brand px-3.5 py-2.5 text-white md:max-w-[75%]">
              {m.files?.length ? <Attachments files={m.files} mine /> : null}
              {m.text ? <p className="whitespace-pre-line text-[14px] leading-relaxed">{m.text}</p> : null}
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

      <form onSubmit={send} className="shrink-0 border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pb-3">
        {pending.length ? (
          <ul aria-label="Прикреплённые файлы" className="mb-2 flex flex-wrap gap-2">
            {pending.map((p, i) => (
              <li key={p.url ?? `${p.file.name}-${p.file.size}-${i}`}>
                <PendingFile
                  item={p}
                  onRemove={() => {
                    if (p.url) URL.revokeObjectURL(p.url);
                    setPending((list) => list.filter((x) => x !== p));
                  }}
                />
              </li>
            ))}
          </ul>
        ) : null}
        {fileError ? <p role="alert" className="mb-2 text-[13px] text-brand">{fileError}</p> : null}
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={ACCEPT}
            tabIndex={-1}
            aria-hidden="true"
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            aria-label="Прикрепить файлы"
            title="Прикрепить файлы: документы и картинки"
            onClick={() => fileRef.current?.click()}
            className="grid size-11 shrink-0 place-items-center rounded-[10px] border border-line bg-white text-muted hover:border-brand hover:text-brand"
          >
            <Paperclip size={18} aria-hidden="true" />
          </button>
          <label htmlFor="chat-input" className="sr-only">Сообщение менеджеру</label>
          <textarea
            id="chat-input"
            rows={1}
            value={draft}
            maxLength={2000}
            placeholder="Напишите сообщение…"
            onChange={(e) => setDraft(e.target.value)}
            onPaste={(e) => {
              const files = Array.from(e.clipboardData.files);
              if (files.length) {
                e.preventDefault();
                addFiles(files);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }}
            className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-[10px] border border-line bg-white px-3.5 py-2.5 text-[15px] [field-sizing:content] placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
          />
          <button
            type="submit"
            aria-label="Отправить"
            disabled={(!draft.trim() && !pending.length) || waiting}
            className={`${buttonClass({ px: "px-0" })} size-11 shrink-0`}
          >
            <SendHorizontal size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-1.5 hidden text-[11px] text-muted lg:block">
          До {MAX_FILES} файлов, каждый до {formatSize(MAX_FILE_SIZE)}: картинки, PDF, Word, Excel, макеты (AI, EPS, CDR). Можно перетащить в окно чата.
        </p>
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

type Pending = { file: File; url: string | null };

/** Превью файла, выбранного к отправке. */
function PendingFile({ item: { file, url }, onRemove }: { item: Pending; onRemove: () => void }) {
  return (
    <div className="relative flex h-14 items-center gap-2 rounded-[10px] border border-line bg-surface pr-8 pl-1.5">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- локальное превью (blob:)
        <img src={url} alt="" className="size-11 rounded-md object-cover" />
      ) : (
        <span aria-hidden="true" className="grid size-11 place-items-center rounded-md bg-white text-[10px] font-bold text-brand">
          {extOf(file.name)}
        </span>
      )}
      <span className="max-w-[140px] min-w-0">
        <span className="block truncate text-[12px] font-medium">{file.name}</span>
        <span className="block text-[11px] text-muted">{formatSize(file.size)}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Убрать файл ${file.name}`}
        className="absolute right-1 top-1 grid size-6 place-items-center rounded-full text-muted hover:bg-white hover:text-brand"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Вложения в сообщении: картинки сеткой, документы карточками. */
function Attachments({ files, mine = false }: { files: ChatFile[]; mine?: boolean }) {
  const images = files.filter(isImage);
  const docs = files.filter((f) => !isImage(f));
  return (
    <div className="mb-1.5 grid gap-1.5">
      {images.length ? (
        <ul className={`grid gap-1.5 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
          {images.map((f) => (
            <li key={f.id}>
              <StoredFile file={f} mine={mine} image />
            </li>
          ))}
        </ul>
      ) : null}
      {docs.map((f) => (
        <StoredFile key={f.id} file={f} mine={mine} />
      ))}
    </div>
  );
}

function StoredFile({ file, mine, image = false }: { file: ChatFile; mine: boolean; image?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let alive = true;
    let u: string | null = null;
    void loadFile(file.id).then((blob) => {
      if (!alive) return;
      if (!blob) return setMissing(true);
      u = URL.createObjectURL(blob);
      setUrl(u);
    });
    return () => {
      alive = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [file.id]);

  if (image && url) {
    return (
      <a href={url} target="_blank" rel="noopener" title={file.name} className="block overflow-hidden rounded-[10px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- вложение из IndexedDB (blob:) */}
        <img src={url} alt={file.name} className="aspect-square w-full max-w-[240px] bg-white object-cover" />
      </a>
    );
  }
  const body = (
    <>
      <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-md text-[10px] font-bold ${mine ? "bg-white/20 text-white" : "bg-brand-soft text-brand"}`}>
        {extOf(file.name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">{file.name}</span>
        <span className={`block text-[11px] ${mine ? "text-white/75" : "text-muted"}`}>
          {missing ? "Файл недоступен в этом браузере" : formatSize(file.size)}
        </span>
      </span>
      {url ? <Download size={16} aria-hidden="true" className="ml-auto shrink-0 opacity-70" /> : null}
    </>
  );
  const cls = `flex max-w-[280px] items-center gap-2.5 rounded-[10px] p-1.5 pr-3 ${mine ? "bg-white/10" : "bg-surface"}`;
  return url ? (
    <a href={url} download={file.name} className={`${cls} hover:opacity-90`}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Телефон: тонкая строка заявки под шапкой чата. */
function MobileOrderBar({ chat }: { chat: Chat }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-line bg-white px-4 py-2 text-[12px] lg:hidden">
      <span className="min-w-0 truncate text-muted">
        Заявка <span className="font-semibold text-ink">№ {chat.number}</span> · от {formatPriceValue(chat.total)}
      </span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(chat.orderText);
            setCopied(true);
          } catch {}
        }}
        className="ml-auto inline-flex shrink-0 items-center gap-1 font-medium text-brand"
      >
        {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        {copied ? "Скопировано" : "Текст заявки"}
      </button>
    </div>
  );
}
