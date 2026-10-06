import type { ReactNode } from "react";
import type { Block, Section } from "@/lib/application-types";

export function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  // «Шапка» из одной ячейки на всю ширину: остальные ячейки пустые.
  const spanAll = head.length > 1 && head.slice(1).every((h) => !h);
  const numeric = (s: string) => /^[\d\s.,–-]+$/.test(s) && /\d/.test(s);
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={head[0] || "Таблица"}
      className="overflow-x-auto rounded-[10px] border border-line"
    >
      <table className="w-full min-w-max border-collapse text-[14px] md:min-w-0">
        <thead>
          <tr className="bg-surface">
            {spanAll ? (
              <th scope="col" colSpan={head.length} className="px-4 py-3 text-left font-semibold">
                {head[0]}
              </th>
            ) : (
              head.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`px-4 py-3 text-left align-bottom font-semibold ${
                    i === 0 ? "sticky left-0 z-10 bg-surface" : ""
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
                    className="sticky left-0 z-10 border-t border-line bg-white px-4 py-2.5 text-left font-semibold group-even:bg-[#f9f9f8]"
                  >
                    {c}
                  </th>
                ) : (
                  <td
                    key={ci}
                    className={`border-t border-line px-4 py-2.5 ${numeric(c) ? "tabular-nums" : ""}`}
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
