import type { ReactNode } from "react";
import type { Block, Section } from "@/lib/application-types";

const isNum = (s: string) => /^[\d\s.,–-]+$/.test(s) && /\d/.test(s);

/** Общий хвост вида «, руб./шт.» у всех заголовков числовых колонок выносим в подпись. */
function normalizeHead(head: string[], numericCols: boolean) {
  let caption = "";
  let h = head;
  if (numericCols && head.length > 2) {
    const m = head.slice(1).map((x) => x.match(/^(.*?),\s*(руб\.?(?:\/[^\s,]+)?)\.?$/i));
    if (m.every(Boolean) && new Set(m.map((x) => x![2].toLowerCase())).size === 1) {
      const unit = m[0]![2];
      caption = /\/шт/i.test(unit) ? "Цена за 1 шт., руб." : `Цена, ${unit}`;
      h = [head[0], ...m.map((x) => x![1].trim())];
    }
    const c = h.slice(1).map((x) => x.match(/^Печать в (\d+) (?:цвет|цвета|цветов)$/i));
    if (c.every(Boolean)) {
      h = [h[0], ...c.map((x) => {
        const n = Number(x![1]);
        const w = n % 10 === 1 && n % 100 !== 11 ? "цвет" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "цвета" : "цветов";
        return `${n} ${w}`;
      })];
    }
  }
  return { head: h, caption };
}

export function Table({ head: rawHead, rows }: { head: string[]; rows: string[][] }) {
  // «Шапка» из одной ячейки на всю ширину: остальные ячейки пустые.
  const spanAll = rawHead.length > 1 && rawHead.slice(1).every((h) => !h);
  const cols = rawHead.length;
  const numericCols = !spanAll && cols > 2 && rows.length > 0 && rows.every((r) => r.slice(1).every(isNum));
  const { head, caption } = normalizeHead(rawHead, numericCols);
  const n = cols - 1;
  return (
    <figure>
      {caption ? <figcaption className="mb-2 text-[13px] text-muted">{caption}</figcaption> : null}
      <div
        tabIndex={0}
        role="region"
        aria-label={rawHead[0] || "Таблица"}
        className="overflow-x-auto rounded-[10px] border border-line"
      >
        <table
          className={`w-full border-collapse text-[15px] ${numericCols ? "table-fixed" : "min-w-[520px] md:min-w-0"}`}
          style={numericCols ? { minWidth: 120 + n * 96 } : undefined}
        >
          {numericCols ? (
            <colgroup>
              <col style={{ width: `${(1.6 / (1.6 + n)) * 100}%` }} />
              {head.slice(1).map((_, i) => <col key={i} />)}
            </colgroup>
          ) : null}
          <thead>
            <tr className="bg-surface">
              {spanAll ? (
                <th scope="col" colSpan={cols} className="px-4 py-3 text-left text-[13px] font-semibold text-muted">
                  {head[0]}
                </th>
              ) : (
                head.map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className={`px-4 py-3 align-bottom text-[13px] font-semibold text-muted ${
                      i === 0 ? "sticky left-0 z-10 whitespace-nowrap bg-surface text-left" : numericCols ? "whitespace-nowrap text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="group even:bg-surface/60">
                {r.map((c, ci) =>
                  ci === 0 ? (
                    <th
                      key={ci}
                      scope="row"
                      className="sticky left-0 z-10 whitespace-nowrap border-t border-line bg-white px-4 py-3 text-left font-semibold text-ink group-even:bg-[#f9f9f8]"
                    >
                      {c}
                    </th>
                  ) : (
                    <td
                      key={ci}
                      className={`border-t border-line px-4 py-3 text-ink ${
                        isNum(c) ? "text-right tabular-nums" : ""
                      }`}
                    >
                      {c}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

const LIST =
  "list-none space-y-2 text-[16px] leading-[1.65] text-ink [&>li]:relative [&>li]:pl-5 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.7em] [&>li]:before:size-1.5 [&>li]:before:rounded-full [&>li]:before:bg-brand";

type Item = { kind: "h" | "p" | "ul" | "table" | "cards"; node: ReactNode };

function blockItem(b: Block, key: string): Item {
  if (b.type === "p")
    return { kind: "p", node: <p key={key} className="text-[16px] leading-[1.65] text-ink">{b.text}</p> };
  if (b.type === "ul")
    return {
      kind: "ul",
      node: (
        <ul key={key} className={LIST}>
          {b.items.map((it, j) => <li key={j}>{it}</li>)}
        </ul>
      ),
    };
  return { kind: "table", node: <Table key={key} head={b.head} rows={b.rows} /> };
}

/** Единая шкала отступов: абзац→абзац 16, заголовок→контент 12, смена типа блока и перед h3 — 32. */
function Flow({ items }: { items: Item[] }) {
  return (
    <div>
      {items.map((it, i) => {
        const prev = items[i - 1]?.kind;
        const mt = !prev
          ? ""
          : it.kind === "h"
            ? "mt-8"
            : prev === "h"
              ? "mt-3"
              : prev === "p" && (it.kind === "p" || it.kind === "ul")
                ? "mt-4"
                : "mt-8";
        return <div key={i} className={mt}>{it.node}</div>;
      })}
    </div>
  );
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return <Flow items={blocks.map((b, i) => blockItem(b, String(i)))} />;
}

function Cards({ adv, lim }: { adv: Section; lim: Section }) {
  const card = (s: Section) => (
    <section className="h-full rounded-[14px] bg-surface p-6">
      <h3 className="text-[18px] font-semibold leading-snug">{s.heading}</h3>
      <div className="mt-3">
        <Blocks blocks={s.blocks.filter((b) => b.type === "ul")} />
      </div>
    </section>
  );
  return (
    <div className="grid items-stretch gap-4 xl:grid-cols-2">
      {card(adv)}
      {card(lim)}
    </div>
  );
}

/** Преимущества и ограничения — две карточки одной высоты; всё остальное — единым потоком. */
export function Sections({ sections }: { sections: Section[] }) {
  const items: Item[] = [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const next = sections[i + 1];
    if (s.heading === "Преимущества" && next?.heading === "Ограничения") {
      items.push({ kind: "cards", node: <Cards adv={s} lim={next} /> });
      next.blocks
        .filter((b) => b.type !== "ul")
        .forEach((b, j) => items.push(blockItem(b, `r${i}-${j}`)));
      i++;
      continue;
    }
    if (s.heading) items.push({ kind: "h", node: <h3 className="text-[20px] font-semibold leading-snug">{s.heading}</h3> });
    s.blocks.forEach((b, j) => items.push(blockItem(b, `${i}-${j}`)));
  }
  return <Flow items={items} />;
}
