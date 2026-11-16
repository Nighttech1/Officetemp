"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Dark zinc glass + C-181 soft hover lift. */
export function GlassCard({ children, className }: Props) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={cn("glass-card", className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("glass-card", className)}
      whileHover={{
        y: -2,
        boxShadow: "0 18px 48px -20px rgba(34,197,94,0.22)",
      }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      {children}
    </motion.div>
  );
}
