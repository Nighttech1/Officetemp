"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

/** Primary CTA with subtle shimmer glow (21st.dev-inspired). */
export function ShimmerButton({
  className,
  loading,
  disabled,
  children,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "shimmer-btn relative inline-flex min-h-touch min-w-touch items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-[0_0_24px_-6px_rgba(34,197,94,0.55)] transition-[box-shadow,transform] duration-200 hover:scale-[1.02] hover:bg-brand-hover hover:shadow-[0_0_36px_-4px_rgba(34,197,94,0.7)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100",
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      <span className="relative z-10">{loading ? "Подождите…" : children}</span>
    </button>
  );
}
