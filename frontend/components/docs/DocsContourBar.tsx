"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Product = "info_sheet" | "waybill";

type Props = {
  product: Product;
  /** Prominent section title on the left (replaces breadcrumbs). */
  title: string;
  /** Optional actions (Settings / Library) rendered before product pills. */
  actions?: ReactNode;
  className?: string;
};

const PRODUCTS: { id: Product; label: string; href: string }[] = [
  { id: "info_sheet", label: "ИУЛ", href: "/app/documents/info-sheet" },
  { id: "waybill", label: "Накладные", href: "/app/documents/waybills" },
];

/**
 * C-212: contour chrome — title left, optional actions + ИУЛ/Накладные pills right.
 * Breadcrumbs removed.
 */
export function DocsContourBar({ product, title, actions, className }: Props) {
  const reduce = useReducedMotion();

  return (
    <motion.nav
      aria-label="Контур DocSaaS"
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-4",
        className,
      )}
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <h1 className="text-balance text-lg font-semibold text-ink sm:text-xl">
        {title}
      </h1>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}

        <div
          className="relative inline-flex rounded-full border border-white/15 bg-black/25 p-1"
          role="group"
          aria-label="Раздел документов"
        >
          {PRODUCTS.map((p) => {
            const on = p.id === product;
            return (
              <Link
                key={p.id}
                href={p.href}
                className={cn(
                  "relative z-10 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors sm:text-sm",
                  on ? "text-zinc-950" : "text-ink hover:text-white",
                )}
                aria-current={on ? "page" : undefined}
              >
                {on && !reduce ? (
                  <motion.span
                    layoutId="docs-contour-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-brand shadow-[0_0_24px_-6px_rgba(34,197,94,0.55)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : on ? (
                  <span className="absolute inset-0 -z-10 rounded-full bg-brand" />
                ) : null}
                {p.label}
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
