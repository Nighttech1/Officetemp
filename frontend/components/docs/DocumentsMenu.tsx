"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const DOC_LINKS = [
  {
    href: "/app/documents/info-sheet",
    label: "Информационно-удостоверяющий лист",
  },
  {
    href: "/app/documents/waybills",
    label: "Накладные",
  },
] as const;

type Props = {
  variant: "landing" | "app";
  /** Landing cream nav: dark text on light bar */
  light?: boolean;
  /** Close parent mobile drawer after navigate */
  onNavigate?: () => void;
  className?: string;
};

function canHover(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover)").matches
  );
}

export function DocumentsMenu({
  variant,
  light = false,
  onNavigate,
  className,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();

  const active = DOC_LINKS.some(
    (l) => pathname === l.href || pathname.startsWith(`${l.href}/`),
  );

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openMenu() {
    clearCloseTimer();
    setOpen(true);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  }

  useEffect(() => () => clearCloseTimer(), []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const triggerLanding = light
    ? "text-landing-dark/65 hover:text-landing-dark"
    : "text-landing-muted hover:text-landing-cream";

  const triggerApp = active
    ? "bg-brand-muted text-brand-ink"
    : "text-ink-soft hover:bg-surface-muted";

  const panelLanding = light
    ? "border-landing-dark/10 bg-landing-cream text-landing-dark shadow-lg"
    : "border-white/10 bg-landing-dark text-landing-cream shadow-xl";

  const panelApp =
    "border-line bg-surface-card text-ink shadow-xl backdrop-blur-md";

  const itemLanding = light
    ? "text-landing-dark/80 hover:bg-landing-dark/5 hover:text-landing-dark"
    : "text-landing-cream/85 hover:bg-white/10 hover:text-landing-cream";

  const itemApp = "text-ink-soft hover:bg-surface-muted hover:text-ink";

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onMouseEnter={() => {
        if (canHover()) openMenu();
      }}
      onMouseLeave={() => {
        if (canHover()) scheduleClose();
      }}
    >
      <button
        type="button"
        className={cn(
          "inline-flex min-h-touch items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          variant === "landing"
            ? cn("whitespace-nowrap focus-visible:ring-offset-transparent", triggerLanding)
            : cn("focus-visible:ring-offset-surface", triggerApp),
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => {
          clearCloseTimer();
          setOpen((v) => !v);
        }}
        onFocus={() => openMenu()}
      >
        Документы
        <span className="text-[0.65em] opacity-70" aria-hidden>
          ▾
        </span>
      </button>

      {/*
        pt-2 = «мостик» под курсор: раньше mt-1 делал щель вне родителя,
        mouseleave закрывал меню до клика по пункту.
      */}
      <div
        id={menuId}
        role="menu"
        aria-label="Разделы документов"
        className={cn(
          "absolute left-0 top-full z-[60] min-w-[16rem] pt-2 transition-[opacity,visibility] duration-150",
          open
            ? "pointer-events-auto visible opacity-100"
            : "pointer-events-none invisible opacity-0",
        )}
      >
        <div
          className={cn(
            "rounded-xl border p-1.5",
            variant === "landing" ? panelLanding : panelApp,
          )}
        >
          {DOC_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm transition-colors",
                  variant === "landing" ? itemLanding : itemApp,
                  isActive &&
                    (variant === "app"
                      ? "bg-brand-muted text-brand-ink"
                      : light
                        ? "bg-landing-dark/8 font-medium text-landing-dark"
                        : "bg-white/10 font-medium text-landing-cream"),
                )}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
