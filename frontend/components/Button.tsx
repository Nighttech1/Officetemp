import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-zinc-950 hover:bg-brand-hover hover:shadow-glow focus-visible:ring-brand disabled:bg-brand/50",
  secondary:
    "bg-surface-card/80 text-ink border border-line hover:bg-surface-muted focus-visible:ring-brand",
  ghost:
    "bg-transparent text-ink-soft hover:bg-surface-muted focus-visible:ring-brand",
  danger:
    "bg-danger-soft text-danger hover:bg-danger/20 focus-visible:ring-danger",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

export function Button({
  className,
  variant = "primary",
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
        "inline-flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-[colors,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "Подождите…" : children}
    </button>
  );
}
