"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  /** Текст/элемент кнопки-триггера (обычно «?») */
  trigger: ReactNode;
  /** Подпись для a11y */
  ariaLabel: string;
  title: string;
  children: ReactNode;
  className?: string;
  /** Ширина панели */
  panelClassName?: string;
};

/**
 * Шпаргалка как «Личный кабинет»: открытие при наведении / клике.
 * Панель в portal → document.body, чтобы не клипалась overflow мастера.
 */
export function HelpHoverPopover({
  trigger,
  ariaLabel,
  title,
  children,
  className,
  panelClassName,
}: Props) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 22 * 16,
  });

  function clearTimers() {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }

  function scheduleOpen() {
    clearTimers();
    openTimer.current = setTimeout(() => setOpen(true), 120);
  }

  function scheduleClose() {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), 220);
  }

  useEffect(() => {
    setMounted(true);
    return () => clearTimers();
  }, []);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const update = () => {
      const rect = rootRef.current!.getBoundingClientRect();
      const width = Math.min(window.innerWidth - 16, window.innerWidth < 640 ? 22 * 16 : 26 * 16);
      let left = rect.right - width;
      if (left < 8) left = 8;
      if (left + width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - 8 - width);
      }
      setPos({
        top: rect.bottom + 4,
        left,
        width,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const panel =
    mounted && open
      ? createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label={title}
            className={`fixed z-[200] origin-top-right transition-[opacity,transform] duration-200 ease-out ${
              panelClassName ?? ""
            }`}
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
            }}
            onMouseEnter={scheduleOpen}
            onMouseLeave={scheduleClose}
          >
            <div className="max-h-[min(70dvh,28rem)] overflow-y-auto rounded-xl border border-line bg-surface-card p-4 text-ink shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)]">
              <p className="text-[15px] font-semibold text-ink">{title}</p>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft">
                {children}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex shrink-0 ${className ?? ""}`}
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface-card text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        aria-label={ariaLabel}
        title={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>
      {panel}
    </div>
  );
}
