export default function DocumentsLoading() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4"
      role="status"
      aria-live="polite"
    >
      <div className="h-8 w-8 animate-pulse rounded-full bg-brand/40" aria-hidden />
      <p className="text-sm text-ink-muted">Загрузка раздела…</p>
    </div>
  );
}
