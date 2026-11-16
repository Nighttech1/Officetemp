"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Soft = quieter blobs for app shell */
  intensity?: "full" | "soft";
};

/**
 * Animated aurora / mesh background (Magic UI / Aceternity / 21st.dev inspired).
 * CSS keyframes + transform only; respects prefers-reduced-motion.
 */
export function AuroraBackground({
  children,
  className,
  intensity = "full",
}: Props) {
  const soft = intensity === "soft";

  return (
    <div
      className={cn(
        "relative isolate min-h-dvh overflow-hidden bg-surface text-ink",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className={cn(
            "aurora-blob aurora-blob-a",
            soft && "aurora-blob--soft",
          )}
        />
        <div
          className={cn(
            "aurora-blob aurora-blob-b",
            soft && "aurora-blob--soft",
          )}
        />
        <div
          className={cn(
            "aurora-blob aurora-blob-c",
            soft && "aurora-blob--soft",
          )}
        />
        <div className="aurora-beam" />
        <div className="aurora-grid" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(9,9,11,0.45)_55%,rgba(9,9,11,0.92)_100%)]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
