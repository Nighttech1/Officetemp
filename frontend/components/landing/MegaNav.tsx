"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type MegaItem = { label: string; href: string; desc?: string };
type MegaGroup = { id: string; label: string; items?: MegaItem[]; href?: string };

/** C-182: «О сервисе» — прямая ссылка; без «Услуги»; Решения без лишнего dropdown-хаоса */
const GROUPS: MegaGroup[] = [
  { id: "about", label: "О сервисе", href: "/#about" },
  {
    id: "solutions",
    label: "Решения",
    items: [
      { label: "Накладные", href: "/app/documents/waybills", desc: "Комплекты из таблицы" },
      { label: "ИУЛ", href: "/app/documents/info-sheet", desc: "Пакет из PDF с ЭЦП" },
    ],
  },
  { id: "contact", label: "Контакты", href: "/contact" },
];

const APP_PREFETCH = [
  "/app/documents/waybills",
  "/app/documents/info-sheet",
] as const;

type Props = {
  light: boolean;
  onNavigate?: () => void;
  mobile?: boolean;
};

/** C-164: тот же hover/delay/мостик/анимация, что LoginPopover */
export function MegaNav({ light, onNavigate, mobile = false }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    for (const href of APP_PREFETCH) {
      router.prefetch(href);
    }
  }, [router]);

  function clearTimers() {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }

  function scheduleOpen(id: string) {
    clearTimers();
    openTimer.current = setTimeout(() => setOpenId(id), 120);
  }

  function scheduleClose() {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpenId(null), 220);
  }

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (!openId) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  const linkBase = light
    ? "text-landing-ink/75 hover:text-landing-ink"
    : "text-white/75 hover:text-white";

  if (mobile) {
    return (
      <nav className="flex flex-col gap-1" aria-label="Основное меню">
        {GROUPS.map((g) =>
          g.items ? (
            <div key={g.id} className="border-b border-white/10 py-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-wider text-brand">
                {g.label}
              </p>
              <ul className="mt-1">
                {g.items.map((it) => (
                  <li key={it.href + it.label}>
                    <Link
                      href={it.href}
                      prefetch={true}
                      className="block rounded-lg px-2 py-2 text-sm text-white/85 hover:bg-white/10"
                      onClick={onNavigate}
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Link
              key={g.id}
              href={g.href || "/"}
              className="rounded-lg px-2 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
              onClick={onNavigate}
            >
              {g.label}
            </Link>
          ),
        )}
      </nav>
    );
  }

  return (
    <div ref={rootRef} className="relative flex items-center gap-1 lg:gap-2">
      {GROUPS.map((g) => {
        if (!g.items) {
          return (
            <Link
              key={g.id}
              href={g.href || "/"}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${linkBase}`}
            >
              {g.label}
            </Link>
          );
        }
        const open = openId === g.id;
        const panelId = `${baseId}-${g.id}`;
        return (
          <div
            key={g.id}
            className="relative"
            onMouseEnter={() => scheduleOpen(g.id)}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              className={`flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${linkBase} ${open ? (light ? "text-landing-ink" : "text-white") : ""}`}
              aria-expanded={open}
              aria-haspopup="true"
              aria-controls={panelId}
              onClick={() => setOpenId(open ? null : g.id)}
            >
              {g.label}
              <span className="text-[10px] opacity-60" aria-hidden>
                ▾
              </span>
            </button>
            <div
              id={panelId}
              role="menu"
              className={`absolute left-1/2 top-full z-[60] w-[min(100vw-2rem,18rem)] -translate-x-1/2 pt-2 transition-[opacity,transform,visibility] duration-200 ${
                open
                  ? "visible translate-y-0 opacity-100"
                  : "invisible -translate-y-1 opacity-0"
              }`}
              onMouseEnter={() => scheduleOpen(g.id)}
              onMouseLeave={scheduleClose}
            >
              <ul
                className={`rounded-xl border p-2 shadow-xl ${
                  light
                    ? "border-landing-ink/10 bg-white"
                    : "border-white/12 bg-[#121211]"
                }`}
              >
                {g.items.map((it) => (
                  <li key={it.href + it.label} role="none">
                    <Link
                      role="menuitem"
                      href={it.href}
                      prefetch={true}
                      className={`block rounded-lg px-3 py-2.5 transition-colors ${
                        light
                          ? "hover:bg-landing-ink/5"
                          : "hover:bg-white/8"
                      }`}
                      onClick={() => setOpenId(null)}
                    >
                      <span
                        className={`block text-sm font-semibold ${light ? "text-landing-ink" : "text-landing-cream"}`}
                      >
                        {it.label}
                      </span>
                      {it.desc ? (
                        <span
                          className={`mt-0.5 block text-xs ${light ? "text-landing-ink/55" : "text-white/70"}`}
                        >
                          {it.desc}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
