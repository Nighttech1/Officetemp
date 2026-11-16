"use client";

import { Button } from "@/components/Button";
import { FieldSelect } from "@/components/ui/FieldSelect";

export type RegistryFieldRow = { field: string; column: string };

type Props = {
  rows: RegistryFieldRow[];
  onChange: (rows: RegistryFieldRow[]) => void;
  className?: string;
  listClassName?: string;
  /** Колонки подключённой таблицы-реестра — выпадающие списки вниз. */
  columnOptions?: string[];
  /** Если true — поле слева только для чтения (из шаблона накладной). */
  lockFields?: boolean;
};

/** Поля реестра (шаг 4 / настройки профиля). */
export function WaybillRegistryFieldList({
  rows,
  onChange,
  className,
  listClassName,
  columnOptions,
  lockFields,
}: Props) {
  const colOpts = [
    { value: "", label: "— не выбрано —" },
    ...(columnOptions ?? []).map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className={className}>
      <div
        className={
          listClassName ??
          "scrollbar-brand flex max-h-[min(420px,50vh)] flex-col gap-2 overflow-y-auto pr-1"
        }
      >
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input
              className="field-control flex-1"
              placeholder="поле результата (number, date…)"
              value={row.field}
              readOnly={lockFields}
              onChange={(e) => {
                if (lockFields) return;
                const next = [...rows];
                next[idx] = { ...next[idx], field: e.target.value };
                onChange(next);
              }}
            />
            <span className="hidden text-ink-muted sm:inline">→</span>
            {columnOptions && columnOptions.length > 0 ? (
              <FieldSelect
                className="flex-1"
                value={row.column}
                aria-label={`Колонка для ${row.field || "поля"}`}
                options={colOpts}
                onChange={(value) => {
                  const next = [...rows];
                  next[idx] = { ...next[idx], column: value };
                  onChange(next);
                }}
              />
            ) : (
              <input
                className="field-control flex-1"
                placeholder="имя колонки в реестре"
                value={row.column}
                onChange={(e) => {
                  const next = [...rows];
                  next[idx] = { ...next[idx], column: e.target.value };
                  onChange(next);
                }}
              />
            )}
            {!lockFields ? (
              <Button
                type="button"
                variant="ghost"
                className="shrink-0 px-2 text-xs"
                onClick={() => onChange(rows.filter((_, i) => i !== idx))}
                disabled={rows.length <= 1}
              >
                Убрать
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      {!lockFields ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-2 self-start text-xs"
          onClick={() => onChange([...rows, { field: "", column: "" }])}
        >
          + Строка
        </Button>
      ) : null}
    </div>
  );
}

export function registryMapToRows(
  map: Record<string, string> | undefined,
): RegistryFieldRow[] {
  if (!map || Object.keys(map).length === 0) {
    return [
      { field: "number", column: "" },
      { field: "date", column: "" },
      { field: "file_link", column: "" },
    ];
  }
  return Object.entries(map).map(([field, column]) => ({ field, column }));
}

export function rowsToRegistryMap(
  rows: RegistryFieldRow[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    const f = row.field.trim();
    const c = row.column.trim();
    if (f && c) out[f] = c;
  }
  return out;
}
