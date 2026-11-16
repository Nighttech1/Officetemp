"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  sheetNames: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  className?: string;
};

/** Мультивыбор листов книги — колонки и строки берутся с отмеченных страниц. */
export function SheetMultiSelect({
  sheetNames,
  selected,
  onChange,
  disabled,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const label =
    selected.length === 0
      ? "— выберите листы —"
      : selected.length === 1
        ? selected[0]
        : `Листов: ${selected.length}`;

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setPos(null);
      return;
    }
    const r = rootRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, 220),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(name: string) {
    if (selected.includes(name)) {
      const next = selected.filter((s) => s !== name);
      onChange(next.length ? next : [name]); // хотя бы один
    } else {
      onChange([...selected, name]);
    }
  }

  const panel =
    open && pos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            id={listId}
            role="listbox"
            aria-multiselectable
            className="z-[200] max-h-64 overflow-auto rounded-xl border border-line bg-surface-card py-1 shadow-lg"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
            }}
          >
            <div className="flex gap-2 border-b border-line px-2 py-1.5">
              <button
                type="button"
                className="text-xs font-medium text-brand hover:underline"
                onClick={() => onChange([...sheetNames])}
              >
                Все
              </button>
              <button
                type="button"
                className="text-xs font-medium text-ink-muted hover:underline"
                onClick={() =>
                  onChange(sheetNames[0] ? [sheetNames[0]] : [])
                }
              >
                Только первый
              </button>
            </div>
            {sheetNames.map((name) => {
              const checked = selected.includes(name);
              return (
                <label
                  key={name}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-surface-muted",
                    checked && "bg-brand/10",
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-line accent-brand"
                    checked={checked}
                    onChange={() => toggle(name)}
                  />
                  <span className="truncate">{name}</span>
                </label>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled || sheetNames.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Листы таблицы"
        className={cn(
          "field-control flex min-h-touch w-full items-center justify-between gap-2 text-left",
          disabled && "opacity-50",
        )}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span
          className={cn(
            "truncate",
            selected.length === 0 && "text-ink-muted",
          )}
        >
          {label}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {panel}
    </div>
  );
}
