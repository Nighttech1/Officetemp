"use client";

import type { WaybillWizardState } from "@/lib/docs-store";

type Props = {
  wizard: WaybillWizardState;
  onChange: (patch: { rowFrom: number; rowTo: number }) => void;
};

/** Выбор диапазона строк данных из файла (1-based, после заголовка). */
export function RowRangePicker({ wizard, onChange }: Props) {
  const n = wizard.rows.length;
  if (n === 0) return null;

  const rangeSet =
    typeof wizard.rowFrom === "number" && typeof wizard.rowTo === "number";
  const from = rangeSet
    ? Math.min(Math.max(wizard.rowFrom!, 1), n)
    : "";
  const to = rangeSet ? Math.min(Math.max(wizard.rowTo!, 1), n) : "";
  const count =
    rangeSet && typeof from === "number" && typeof to === "number"
      ? Math.max(0, to - from + 1)
      : 0;

  function setFrom(v: number) {
    const nextFrom = Math.min(Math.max(Math.floor(v) || 1, 1), n);
    const nextTo = rangeSet
      ? Math.max(wizard.rowTo ?? nextFrom, nextFrom)
      : nextFrom;
    onChange({
      rowFrom: nextFrom,
      rowTo: Math.min(nextTo, n),
    });
  }

  function setTo(v: number) {
    const nextTo = Math.min(Math.max(Math.floor(v) || 1, 1), n);
    const nextFrom = rangeSet
      ? Math.min(wizard.rowFrom ?? 1, nextTo)
      : 1;
    onChange({
      rowFrom: Math.max(nextFrom, 1),
      rowTo: nextTo,
    });
  }

  return (
    <div className="rounded-xl border border-line bg-surface-muted/30 p-3 sm:p-4">
      <p className="text-sm font-semibold text-ink">
        Какие строки взять из файла
      </p>
      <p className="mt-1 text-pretty text-xs text-ink-muted">
        Укажите номера строк данных (1 — первая строка после заголовка). Пока
        диапазон не задан, в предпросмотр данные не подставляются.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-soft">С строки</span>
          <input
            type="number"
            min={1}
            max={n}
            className="field-control w-24"
            value={from}
            placeholder="1"
            onChange={(e) => setFrom(Number(e.target.value))}
            aria-label="С строки"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-soft">По строку</span>
          <input
            type="number"
            min={1}
            max={n}
            className="field-control w-24"
            value={to}
            placeholder={String(n)}
            onChange={(e) => setTo(Number(e.target.value))}
            aria-label="По строку"
          />
        </label>
        <button
          type="button"
          className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-soft hover:bg-surface-muted"
          onClick={() => onChange({ rowFrom: 1, rowTo: n })}
        >
          Все строки (1–{n})
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        {rangeSet
          ? `Выбрано: ${count} из ${n}`
          : `Диапазон ещё не задан · всего строк в таблице: ${n}`}
      </p>
    </div>
  );
}
