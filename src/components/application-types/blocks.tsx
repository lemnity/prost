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
      className="my-4 overflow-x-auto rounded-[10px] border border-line"
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

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "p")
          return (
            <p key={i} className="mt-3 max-w-[78ch] text-[15px] leading-relaxed text-ink/90">
              {b.text}
            </p>
          );
        if (b.type === "ul")
          return (
            <ul key={i} className="mt-3 max-w-[78ch] list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink/90 marker:text-brand">
              {b.items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          );
        return <Table key={i} head={b.head} rows={b.rows} />;
      })}
    </>
  );
}

/** Преимущества и ограничения — в две колонки; остальные секции — подряд. */
export function Sections({ sections }: { sections: Section[] }) {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const next = sections[i + 1];
    if (s.heading === "Преимущества" && next?.heading === "Ограничения") {
      const lists = next.blocks.filter((b) => b.type === "ul");
      const rest = next.blocks.filter((b) => b.type !== "ul");
      out.push(
        <div key={i} className="mt-8">
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-[10px] bg-surface p-5">
              <h3 className="text-[18px] font-semibold">{s.heading}</h3>
              <Blocks blocks={s.blocks} />
            </section>
            <section className="rounded-[10px] bg-surface p-5">
              <h3 className="text-[18px] font-semibold">{next.heading}</h3>
              <Blocks blocks={lists} />
            </section>
          </div>
          <Blocks blocks={rest} />
        </div>,
      );
      i++;
      continue;
    }
    out.push(
      <section key={i} className="mt-8 first:mt-0">
        {s.heading ? <h3 className="text-[20px] font-semibold">{s.heading}</h3> : null}
        <Blocks blocks={s.blocks} />
      </section>,
    );
  }
  return <>{out}</>;
}
