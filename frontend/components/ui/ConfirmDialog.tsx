"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** destructive = красноватый акцент удаления */
  tone?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Стеклянное подтверждение (удаление и т.п.). Без window.confirm.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Удалить",
  cancelLabel = "Отмена",
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-[1] w-full max-w-md overflow-hidden rounded-2xl border border-white/12",
          "bg-[rgba(22,24,28,0.92)] text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
          "ring-1 ring-white/5",
        )}
      >
        <div
          className={cn(
            "h-1 w-full",
            tone === "danger"
              ? "bg-gradient-to-r from-rose-500/80 via-[#2fc6f6]/50 to-transparent"
              : "bg-gradient-to-r from-[#2fc6f6]/80 to-transparent",
          )}
        />
        <div className="px-5 pb-5 pt-4">
          <h2 id={titleId} className="text-base font-semibold tracking-tight">
            {title}
          </h2>
          {description ? (
            <div className="mt-2 text-sm leading-relaxed text-white/65">
              {description}
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              className="rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                tone === "danger"
                  ? "bg-rose-500/90 text-white hover:bg-rose-400"
                  : "bg-[#2fc6f6] text-[#0b1a22] hover:bg-[#4dd0f7]",
              )}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
