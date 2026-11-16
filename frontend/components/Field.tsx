import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Field({
  label,
  hint,
  error,
  id,
  className,
  ...rest
}: Props) {
  const fieldId = id || rest.name || label;
  return (
    <label className="flex w-full flex-col gap-1.5" htmlFor={fieldId}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        id={fieldId}
        className={cn(
          "field-control",
          error && "border-danger focus:border-danger focus:ring-danger/30",
          className,
        )}
        {...rest}
      />
      {hint && !error ? (
        <span className="text-pretty text-xs text-ink-muted">{hint}</span>
      ) : null}
      {error ? (
        <span className="text-pretty text-xs text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
