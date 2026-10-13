"use client";

import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/account/store";
import { Field, field } from "@/components/account/form-kit";
import { TOPICS, formatNewsDate, type NewsCard, type Topic } from "@/lib/news-meta";
import type { Banner } from "@/content/home";

const btn = "inline-flex h-11 items-center gap-2 rounded-[10px] bg-brand px-5 text-[14px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60";

/** Раздел «Сайт»: баннеры главной и новости. */
export function AdminSite() {
  return (
    <div className="grid gap-10">
      <BannersBlock />
      <NewsBlock />
    </div>
  );
}

/** Загрузка картинки → адрес /media/<id>. */
function ImageUpload({ value, onChange, label, hint, aspect }: { value: string; onChange: (url: string) => void; label: string; hint: string; aspect: string }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const r = await api<{ url: string }>("/api/admin/site/upload", { method: "POST", body: form });
    setBusy(false);
    if (r.ok) onChange(r.data.url);
    else setError(r.error);
  }
  return (
    <div>
      <span className="text-sm font-medium text-ink">{label} <span className="text-brand">*</span></span>
      <label
        htmlFor={id}
        className={`relative mt-1.5 flex ${aspect} w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-surface text-[14px] text-muted hover:border-brand focus-within:outline-2 focus-within:outline-brand`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- превью только что загруженной картинки
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="inline-flex items-center gap-2"><ImagePlus size={18} aria-hidden="true" /> {busy ? "Загружаем…" : "Выбрать картинку"}</span>
        )}
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="sr-only"
          aria-describedby={`${id}-hint`}
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {error ? <p role="alert" className="mt-1.5 text-[13px] text-brand">{error}</p> : null}
      <p id={`${id}-hint`} className="mt-1.5 text-[12px] text-muted">{value ? "Нажмите на картинку, чтобы заменить. " : ""}{hint}</p>
    </div>
  );
}

/** Удаление в два нажатия: «Удалить» → «Да, удалить». */
function DeleteButton({ label, onDelete }: { label: string; onDelete: () => Promise<void> }) {
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!ask) {
    return (
      <button type="button" onClick={() => setAsk(true)} aria-label={`Удалить: ${label}`} className="inline-flex h-9 items-center gap-1.5 text-[13px] font-medium text-muted hover:text-brand">
        <Trash2 size={15} aria-hidden="true" /> Удалить
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-3 text-[13px]">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onDelete();
          setBusy(false);
          setAsk(false);
        }}
        className="font-semibold text-brand underline hover:text-brand-hover"
      >
        Да, удалить
      </button>
      <button type="button" onClick={() => setAsk(false)} className="font-medium text-muted hover:text-ink">Отмена</button>
    </span>
  );
}

function BannersBlock() {
  const [items, setItems] = useState<Banner[] | null>(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const load = useCallback(async () => {
    const r = await api<{ banners: Banner[] }>("/api/admin/site/banners", { cache: "no-store" });
    if (r.ok) setItems(r.data.banners);
    else setError(r.error);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- загрузка с сервера: setState после await
    void load();
  }, [load]);

  async function remove(id: string) {
    const r = await api(`/api/admin/site/banners?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!r.ok) setError(r.error);
    await load();
  }

  return (
    <section aria-labelledby="site-banners">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="site-banners" className="mr-auto text-[22px] font-bold">Баннеры на главной</h2>
        {!adding ? (
          <button type="button" onClick={() => setAdding(true)} className={btn}>
            <Plus size={16} aria-hidden="true" /> Добавить баннер
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-[14px] text-muted">Показываются в слайдере в этом порядке. Новый баннер встаёт в конец.</p>
      {error ? <p role="alert" className="mt-3 text-brand">{error}</p> : null}
      {adding ? (
        <BannerForm
          onDone={async (saved) => {
            setAdding(false);
            if (saved) await load();
          }}
        />
      ) : null}
      {!items ? (
        <div aria-busy="true" className="mt-4 h-[200px] animate-pulse rounded-[14px] bg-surface motion-reduce:animate-none" />
      ) : !items.length ? (
        <p className="mt-4 rounded-[14px] bg-surface p-8 text-center text-muted">Баннеров нет, слайдер на главной скрыт</p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((b, i) => (
            <li key={b.id} className="overflow-hidden rounded-[14px] border border-line bg-white">
              <div className="relative aspect-[2400/644] bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element -- превью в админке */}
                <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <div className="flex items-start gap-3 p-3">
                <div className="min-w-0 flex-1 text-[13px]">
                  <p className="font-medium text-ink">{i + 1}. {b.alt}</p>
                  {b.href ? <p className="mt-0.5 truncate text-muted">Ссылка: {b.href}</p> : null}
                </div>
                <DeleteButton label={b.alt} onDelete={() => remove(b.id)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BannerForm({ onDone }: { onDone: (saved: boolean) => void | Promise<void> }) {
  const [image, setImage] = useState("");
  const [alt, setAlt] = useState("");
  const [href, setHref] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api("/api/admin/site/banners", { method: "POST", body: JSON.stringify({ image, alt, href }) });
    setBusy(false);
    if (r.ok) await onDone(true);
    else setError(r.error);
  }
  return (
    <form onSubmit={submit} className="mt-4 grid gap-4 rounded-[14px] border border-line bg-white p-4 md:p-5">
      <ImageUpload value={image} onChange={setImage} label="Картинка" hint="Размер 2400×644 px (пропорция как у слайдера), до 10 МБ." aspect="aspect-[2400/644]" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="banner-alt" label="Описание" required hint="Что написано на баннере: для поисковиков и экранных дикторов.">
          {(p) => <input {...p} value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} className={field} />}
        </Field>
        <Field name="banner-href" label="Ссылка" hint="Необязательно. Например, /catalog/novyy-god">
          {(p) => <input {...p} value={href} onChange={(e) => setHref(e.target.value)} maxLength={500} placeholder="/catalog/…" className={field} />}
        </Field>
      </div>
      {error ? <p role="alert" className="text-[14px] text-brand">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className={btn}>{busy ? "Сохраняем…" : "Добавить"}</button>
        <button type="button" onClick={() => void onDone(false)} className="h-11 px-3 text-[14px] font-medium text-muted hover:text-ink">Отмена</button>
      </div>
    </form>
  );
}

function NewsBlock() {
  const [items, setItems] = useState<NewsCard[] | null>(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const load = useCallback(async () => {
    const r = await api<{ news: NewsCard[] }>("/api/admin/site/news", { cache: "no-store" });
    if (r.ok) setItems(r.data.news);
    else setError(r.error);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- загрузка с сервера: setState после await
    void load();
  }, [load]);

  async function remove(slug: string) {
    const r = await api(`/api/admin/site/news?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    if (!r.ok) setError(r.error);
    await load();
  }

  return (
    <section aria-labelledby="site-news">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="site-news" className="mr-auto text-[22px] font-bold">Новости и статьи</h2>
        {!adding ? (
          <button type="button" onClick={() => setAdding(true)} className={btn}>
            <Plus size={16} aria-hidden="true" /> Добавить новость
          </button>
        ) : null}
      </div>
      {error ? <p role="alert" className="mt-3 text-brand">{error}</p> : null}
      {adding ? (
        <NewsForm
          onDone={async (saved) => {
            setAdding(false);
            if (saved) await load();
          }}
        />
      ) : null}
      {!items ? (
        <div aria-busy="true" className="mt-4 h-[200px] animate-pulse rounded-[14px] bg-surface motion-reduce:animate-none" />
      ) : !items.length ? (
        <p className="mt-4 rounded-[14px] bg-surface p-8 text-center text-muted">Новостей пока нет</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {items.map((n) => (
            <li key={n.slug} className="flex items-center gap-4 rounded-[14px] border border-line bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- превью в админке */}
              <img src={n.cover} alt="" className="h-16 w-24 shrink-0 rounded-lg bg-surface object-cover" />
              <div className="min-w-0 flex-1">
                <Link href={`/news/${n.slug}`} target="_blank" className="block truncate text-[15px] font-semibold hover:text-brand">{n.title}</Link>
                <p className="mt-0.5 text-[13px] text-muted">
                  {formatNewsDate(n.date)}
                  {n.topics.length ? ` · ${n.topics.map((t) => TOPICS[t]).join(", ")}` : ""}
                </p>
              </div>
              <DeleteButton label={n.title} onDelete={() => remove(n.slug)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function NewsForm({ onDone }: { onDone: (saved: boolean) => void | Promise<void> }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today);
  const [cover, setCover] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [text, setText] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api("/api/admin/site/news", { method: "POST", body: JSON.stringify({ title, date, cover, excerpt, text, topics }) });
    setBusy(false);
    if (r.ok) await onDone(true);
    else setError(r.error);
  }
  return (
    <form onSubmit={submit} className="mt-4 grid gap-4 rounded-[14px] border border-line bg-white p-4 md:p-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <Field name="news-title" label="Заголовок" required>
          {(p) => <input {...p} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} className={field} />}
        </Field>
        <Field name="news-date" label="Дата" required>
          {(p) => <input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />}
        </Field>
      </div>
      <div className="max-w-[420px]">
        <ImageUpload value={cover} onChange={setCover} label="Обложка" hint="Горизонтальная, примерно 1600×900 px, до 10 МБ." aspect="aspect-[16/9]" />
      </div>
      <Field name="news-excerpt" label="Анонс" hint="Пара предложений для списка новостей и поисковиков. Если пусто — возьмём начало статьи.">
        {(p) => <textarea {...p} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} maxLength={600} className={field} />}
      </Field>
      <Field
        name="news-text"
        label="Текст статьи"
        required
        hint="Абзацы разделяйте пустой строкой. «## » в начале строки — заголовок, «### » — подзаголовок, строки с «- » — список."
      >
        {(p) => <textarea {...p} value={text} onChange={(e) => setText(e.target.value)} rows={14} className={`${field} font-mono text-[14px]`} />}
      </Field>
      <fieldset>
        <legend className="text-sm font-medium text-ink">Темы</legend>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {(Object.keys(TOPICS) as Topic[]).map((t) => (
            <label key={t} className="inline-flex items-center gap-2 text-[14px]">
              <input
                type="checkbox"
                checked={topics.includes(t)}
                onChange={(e) => setTopics((s) => (e.target.checked ? [...s, t] : s.filter((x) => x !== t)))}
                className="size-4 accent-brand"
              />
              {TOPICS[t]}
            </label>
          ))}
        </div>
      </fieldset>
      {error ? <p role="alert" className="text-[14px] text-brand">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className={btn}>{busy ? "Публикуем…" : "Опубликовать"}</button>
        <button type="button" onClick={() => void onDone(false)} className="h-11 px-3 text-[14px] font-medium text-muted hover:text-ink">Отмена</button>
      </div>
    </form>
  );
}
