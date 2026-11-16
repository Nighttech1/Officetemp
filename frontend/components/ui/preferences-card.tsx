"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

/** Preferences Card — список опций; detail выезжает справа (iOS-style). */

const EASE = [0.16, 1, 0.3, 1] as const;

const TEXT = "var(--foreground)";
const TEXT_MUTED = "var(--muted-foreground)";
const HAIRLINE = "var(--border)";

const ROW_H = 64;
/** 1.5 × 14px (h-3.5) */
const CHEVRON = "h-[1.3125rem] w-[1.3125rem]";

export type PreferenceRow = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  hint: string;
  detail?: ReactNode;
};

export function PreferencesCard({
  rows,
  width,
  className = "",
  /** Сразу открыть detail этой строки (например «Облачная таблица» при сохранённой ссылке). */
  defaultActiveTitle,
}: {
  rows: PreferenceRow[];
  width?: number;
  className?: string;
  defaultActiveTitle?: string | null;
}) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState<string | null>(
    defaultActiveTitle && rows.some((r) => r.title === defaultActiveTitle)
      ? defaultActiveTitle
      : null,
  );
  useEffect(() => {
    if (
      defaultActiveTitle &&
      rows.some((r) => r.title === defaultActiveTitle)
    ) {
      setActive(defaultActiveTitle);
    }
    // только смена default — не rows (иначе каждый cloudConnecting сбрасывает анимацию)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultActiveTitle]);
  const introDone = useRef(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const [menuH, setMenuH] = useState(0);
  useLayoutEffect(() => {
    if (shellRef.current) setMenuH(shellRef.current.offsetHeight);
  }, [rows.length, active]);
  const activeRow = rows.find((r) => r.title === active);

  const slide = reduced ? { duration: 0 } : { duration: 0.4, ease: EASE };
  const dx = reduced ? 0 : 28;

  return (
    <div
      ref={shellRef}
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        width: width != null ? width + 16 : "100%",
        maxWidth: "100%",
        minHeight: Math.max(rows.length * ROW_H + 8, menuH),
      }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {activeRow ? (
          <motion.div
            key={activeRow.title}
            className="flex w-full flex-col gap-2"
            initial={{ x: dx, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dx, opacity: 0 }}
            transition={slide}
          >
            <button
              type="button"
              onClick={() => setActive(null)}
              className="group flex w-full items-center gap-2 rounded-lg border px-3 py-3 text-left transition-colors duration-200 hover:bg-foreground/[0.035]"
              style={{ borderColor: HAIRLINE }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                <ChevronLeft
                  className={`${CHEVRON} text-foreground/45 transition-transform duration-200 group-hover:-translate-x-0.5`}
                />
              </span>
              <span
                className="text-sm font-semibold tracking-[-0.01em]"
                style={{ color: TEXT }}
              >
                {activeRow.title}
              </span>
            </button>
            <div className="px-1 py-1">{activeRow.detail}</div>
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            className="flex w-full flex-col gap-2"
            initial={{ x: -dx, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -dx, opacity: 0 }}
            transition={slide}
            onAnimationComplete={() => {
              introDone.current = true;
            }}
          >
            {rows.map((r, i) => {
              const Icon = r.icon;
              return (
                <motion.button
                  key={r.title}
                  type="button"
                  onClick={r.detail ? () => setActive(r.title) : undefined}
                  className="group flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors duration-200 hover:bg-foreground/[0.035]"
                  style={{ borderColor: HAIRLINE }}
                  initial={
                    introDone.current || reduced ? false : { opacity: 0, y: 6 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: 0.45, ease: EASE, delay: i * 0.06 }
                  }
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-foreground/[0.03]"
                    style={{ borderColor: HAIRLINE }}
                  >
                    <Icon
                      className="h-[15px] w-[15px] text-muted-foreground"
                      strokeWidth={1.75}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block text-sm font-semibold tracking-[-0.01em]"
                      style={{ color: TEXT }}
                    >
                      {r.title}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-sm leading-snug"
                      style={{ color: TEXT_MUTED }}
                    >
                      {r.hint}
                    </span>
                  </span>
                  {r.detail ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                      <ChevronRight
                        className={`${CHEVRON} text-foreground/45 transition-transform duration-200 group-hover:translate-x-0.5`}
                      />
                    </span>
                  ) : null}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PreferencesCard;
