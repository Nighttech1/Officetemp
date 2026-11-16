const NAMES = [
  "Word",
  "Excel",
  "Google Sheets",
  "Яндекс Таблицы",
  "PDF",
  "Celery",
  "152‑ФЗ",
  "ZIP",
] as const;

/**
 * C-189: без border у бегущей строки — отступ снизу того же cream, граница не видна.
 * C-186: отступ ≈ 2× высоты полосы; hover → чёрный жирный.
 */
export function IntegrationsStrip() {
  const half = [...NAMES, ...NAMES, ...NAMES];
  const loop = [...half, ...half];
  return (
    <section
      className="landing-section bg-landing-cream text-landing-ink"
      data-landing-theme="white"
      aria-label="Интеграции и контур"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="landing-reveal text-center font-hero text-[clamp(1.4rem,3vw,2.1rem)] font-bold tracking-tight">
          Работает с тем, чем вы уже пользуетесь
        </h2>
        <p className="landing-reveal mx-auto mt-3 max-w-2xl text-center text-sm text-landing-ink/60 sm:text-base">
          Не заменяем ERP ради красоты — стыкуем шаблоны и таблицы, которые уже
          есть в работе.
        </p>
      </div>
      <div className="landing-marquee bg-landing-cream py-5" aria-hidden>
        <div className="landing-marquee-track flex items-center gap-10 whitespace-nowrap sm:gap-12">
          {loop.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="inline-flex shrink-0 items-center gap-10 font-hero text-lg font-semibold tracking-tight text-landing-ink/55 transition-[color,font-weight] duration-200 hover:font-bold hover:text-black sm:gap-12 sm:text-xl"
            >
              {name}
              <span className="pointer-events-none text-landing-ink/25" aria-hidden>
                ·
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
