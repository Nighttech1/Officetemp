const STATS = [
  {
    value: "1000+",
    label: "документов в пакете",
    hint: "очередь Celery без ручной сборки",
  },
  {
    value: "0",
    label: "срывов вёрстки",
    hint: "ваш Word остаётся эталоном",
  },
  {
    value: "152‑ФЗ",
    label: "контур ПДн",
    hint: "изоляция организаций и согласия",
  },
] as const;

/** C-166: убрали «Записаться на демо» → 3 stats (21st metrics row spirit) */
export function IntroProduct() {
  return (
    <section
      className="landing-section bg-landing-cream text-landing-ink"
      data-landing-theme="cream"
      id="about"
      aria-labelledby="intro-product-title"
    >
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="landing-reveal text-xs font-semibold uppercase tracking-[0.25em] text-brand">
            Doc Engine
          </p>
          <h2
            id="intro-product-title"
            className="landing-reveal mt-4 font-hero text-[clamp(1.75rem,4.5vw,3.25rem)] font-bold leading-[1.1] tracking-tight"
          >
            Делает работу, а не советует, как её сделать
          </h2>
          <p className="landing-reveal mx-auto mt-6 max-w-2xl text-base leading-relaxed text-landing-ink/65 sm:text-lg">
            Не нужно менять привычный Word. Подключаете таблицы, стыкуете поля,
            запускаете пакет — получаете DOCX/PDF с той же структурой, что в
            исходном шаблоне.
          </p>
        </div>

        <ul className="landing-reveal mt-12 grid gap-4 sm:grid-cols-3 sm:gap-5">
          {STATS.map((s) => (
            <li
              key={s.label}
              className="group relative overflow-hidden rounded-3xl border border-landing-ink/10 bg-white p-6 shadow-[0_12px_40px_rgba(17,17,17,0.04)] transition-[border-color,box-shadow] hover:border-brand/40 hover:shadow-[0_16px_48px_rgba(34,197,94,0.12)] sm:p-8"
            >
              <span
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/10 blur-2xl transition-opacity group-hover:opacity-100"
                aria-hidden
              />
              <p className="relative font-hero text-[clamp(2rem,4vw,2.75rem)] font-bold tracking-tight text-brand">
                {s.value}
              </p>
              <p className="relative mt-2 font-display text-base font-semibold text-landing-ink">
                {s.label}
              </p>
              <p className="relative mt-2 text-sm leading-relaxed text-landing-ink/55">
                {s.hint}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
