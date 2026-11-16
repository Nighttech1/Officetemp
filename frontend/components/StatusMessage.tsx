import { cn } from "@/lib/utils";

type Props = {
  message: string | null;
  tone?: "error" | "ok" | "info";
  className?: string;
};

export function StatusMessage({ message, tone = "error", className }: Props) {
  if (!message) return null;
  const tones = {
    error: "bg-danger-soft text-danger border-danger/20",
    ok: "bg-ok-soft text-ok border-ok/20",
    info: "bg-brand-muted text-brand-ink border-brand/20",
  };
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2 text-pretty text-sm",
        tones[tone],
        className,
      )}
    >
      {message}
    </p>
  );
}
