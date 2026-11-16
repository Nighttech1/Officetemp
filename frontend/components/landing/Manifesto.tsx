const STATS = [
  { value: "DOCX", label: "и PDF без ручной вёрстки" },
  { value: "1000+", label: "файлов в одной очереди" },
  { value: "152‑ФЗ", label: "персональные данные в РФ" },
] as const;

export function Manifesto() {
  return (
    <section
      className="landing-section bg-landing-dark px-4 py-20 text-landing-cream sm:px-6 sm:py-28 lg:px-8"
      aria-labelledby="manifesto-title"
    >
      <div className="mx-auto max-w-6xl">
        <p className="landing-reveal mb-10 text-xs uppercase tracking-[0.28em] text-landing-muted">
          (Платформа)
        </p>

        <div className="landing-reveal mb-14 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {STATS.map((s) => (
            <div key={s.value} className="border-t border-white/15 pt-4">
              <p className="font-hero text-2xl font-semibold tracking-tight sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm text-landing-muted">{s.label}</p>
            </div>
          ))}
        </div>

        <h2
          id="manifesto-title"
          className="landing-reveal max-w-4xl font-hero text-[clamp(1.75rem,4.5vw,3.25rem)] font-semibold leading-[1.15] tracking-tight"
        >
          Сломанная вёрстка — больше не ваша проблема.{" "}
          <span className="font-display font-normal italic text-landing-cream/85">
            DocSaaS заполняет шаблон Word данными из таблиц и отдаёт пакет
            готовых документов, не ломая поля, колонтитулы и стили.
          </span>
        </h2>
      </div>
    </section>
  );
}
