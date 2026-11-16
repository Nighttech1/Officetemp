"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FieldSelectOption = { value: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: FieldSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * Выпадающий список в стиле field-control: всегда открывается вниз,
 * через portal (не обрезается overflow родителя).
 */
export function FieldSelect({
  value,
  onChange,
  options,
  placeholder = "— не выбрано —",
  disabled,
  className,
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setPos(null);
      return;
    }
    const r = rootRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, 160),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onReposition() {
      if (!rootRef.current) return;
      const r = rootRef.current.getBoundingClientRect();
      setPos({
        top: r.bottom + 4,
        left: r.left,
        width: Math.max(r.width, 160),
      });
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  const list =
    open && pos && typeof document !== "undefined"
      ? createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            className="z-[200] max-h-56 overflow-auto rounded-xl border border-line bg-surface-card py-1 shadow-lg"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
            }}
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li
                  key={opt.value || "__empty__"}
                  role="option"
                  aria-selected={active}
                >
                  <button
                    type="button"
                    className={cn(
                      "flex w-full px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted",
                      active && "bg-brand/15 font-medium text-brand",
                    )}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        className={cn(
          "field-control flex min-h-touch w-full items-center justify-between gap-2 text-left",
          disabled && "opacity-50",
        )}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span className={cn("truncate", !selected && "text-ink-muted")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {list}
    </div>
  );
}
