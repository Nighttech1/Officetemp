"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  stepKey: string | number;
  children: ReactNode;
  className?: string;
  /**
   * При смене (например docId) — один кадр без fade, чтобы не «мигало» окно.
   * Смена шага внутри того же scope — всегда плавно.
   */
  scopeKey?: string;
};

export function DocsStepMotion({
  stepKey,
  children,
  className,
  scopeKey,
}: Props) {
  const reduce = useReducedMotion();
  const prevScope = useRef<string | undefined>(undefined);
  const skipOnce = useRef(false);

  if (scopeKey !== undefined) {
    if (
      prevScope.current !== undefined &&
      scopeKey !== prevScope.current
    ) {
      skipOnce.current = true;
    }
    prevScope.current = scopeKey;
  }

  useLayoutEffect(() => {
    if (!skipOnce.current) return;
    const id = requestAnimationFrame(() => {
      skipOnce.current = false;
    });
    return () => cancelAnimationFrame(id);
  }, [scopeKey]);

  if (reduce || skipOnce.current) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        className={cn("min-w-0", className)}
        initial={{ opacity: 0, x: 18, filter: "blur(2px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, x: -12, filter: "blur(2px)" }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
