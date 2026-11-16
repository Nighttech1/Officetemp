import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "ink" | "brand";
};

/**
 * Landing primary CTA — rounded-full + soft shimmer (21st 27898 spirit).
 * C-159
 */
export function LandingShimmerLink({
  href,
  children,
  className,
  variant = "ink",
}: Props) {
  const base =
    variant === "brand"
      ? "bg-brand text-landing-dark shadow-[0_0_28px_-6px_rgba(34,197,94,0.65)] hover:bg-brand-hover hover:shadow-[0_0_40px_-4px_rgba(34,197,94,0.8)]"
      : "bg-landing-ink text-landing-grey shadow-[0_12px_40px_-18px_rgba(17,17,17,0.65)] hover:bg-black";

  return (
    <Link
      href={href}
      className={cn(
        "landing-shimmer-cta relative inline-flex min-h-touch items-center justify-center overflow-hidden rounded-full px-7 text-sm font-semibold transition-[box-shadow,background-color,transform] duration-200 hover:scale-[1.02] active:scale-[0.98]",
        base,
        className,
      )}
    >
      <span className="relative z-10">{children}</span>
    </Link>
  );
}
