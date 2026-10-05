"use client";

import { CheckRow, FilterGroup, OptionList, PriceFields } from "./filter-controls";
import { OASIS_HINT, type Filters, type ListFilterKey, type Option } from "./catalog-filters";

export type Group = {
  key: Exclude<ListFilterKey, "prints">;
  label: string;
  /** Варианты с фасетными счётчиками. */
  options: Option[];
  /** Есть ли данные в разделе вообще. */
  hasData: boolean;
  empty: string;
};

const divider = "border-t border-line";

/** Группы фильтров: одни и те же в сайдбаре и в мобильном листе. */
export function FilterPanel({
  filters,
  groups,
  hasNew,
  active,
  onChange,
  onReset,
}: {
  filters: Filters;
  groups: Group[];
  hasNew: boolean;
  active: number;
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
}) {
  const toggle = (key: Group["key"]) => (v: string, on: boolean) =>
    onChange({ [key]: on ? [...filters[key], v] : filters[key].filter((x) => x !== v) });
  const priceOn = filters.min != null || filters.max != null;
  const group = (g: Group) => (
    <div key={g.key} className={divider}>
      <FilterGroup
        label={g.label}
        count={filters[g.key].length}
        defaultOpen={filters[g.key].length > 0 || g.key !== "brands"}
        disabled={!g.hasData}
        hint={g.empty}
      >
        <OptionList name={g.label} options={g.options} selected={filters[g.key]} onToggle={toggle(g.key)} />
      </FilterGroup>
    </div>
  );
  return (
    <div>
      <div className="pb-2">
        <CheckRow
          label="Новинки"
          checked={filters.isNew}
          onChange={(v) => onChange({ isNew: v })}
          disabled={!hasNew && !filters.isNew}
          title={!hasNew ? "Новинок в этом разделе пока нет" : undefined}
        />
        <CheckRow label="Акции" checked={false} onChange={() => {}} disabled title={OASIS_HINT} />
        <CheckRow label="В наличии" checked={filters.inStock} onChange={(v) => onChange({ inStock: v })} />
      </div>
      <fieldset className={`${divider} py-3`}>
        <legend className="sr-only">Цена, ₽</legend>
        <p aria-hidden="true" className="mb-2 px-1.5 text-[14px] font-semibold">
          Цена, ₽{priceOn ? <span className="sr-only"> (выбрано)</span> : null}
        </p>
        <PriceFields min={filters.min} max={filters.max} onApply={(min, max) => onChange({ min, max })} />
      </fieldset>
      {groups.slice(0, 3).map(group)}
      <div className={divider}>
        <FilterGroup label="Нанесение" defaultOpen={false} disabled hint={OASIS_HINT} />
      </div>
      {group(groups[3])}
      {active ? (
        <div className={`${divider} pt-3`}>
          <button
            type="button"
            onClick={onReset}
            className="rounded-md px-1.5 py-1 text-[13px] font-medium text-brand underline-offset-2 hover:text-brand-hover hover:underline"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : null}
    </div>
  );
}
