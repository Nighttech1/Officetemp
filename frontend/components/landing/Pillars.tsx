const PILLARS = [
  {
    kicker: "ШАБЛОН.",
    title: "Word остаётся эталоном",
    body: "Загружаете свой DOCX — система не перерисовывает документ с нуля, а подставляет данные в вашу вёрстку.",
    span: "md:col-span-1",
  },
  {
    kicker: "ДАННЫЕ.",
    title: "Excel, Google, Яндекс",
    body: "Таблица → строки и поля. Стыковка тегов наглядно: что куда пойдёт в документ, видно до генерации.",
    span: "md:col-span-1",
  },
  {
    kicker: "ПОТОК.",
    title: "Очередь вместо ручной сборки",
    body: "Сотни файлов через Celery, ZIP на выходе, контроль доступа под 152‑ФЗ — без «ещё одного чата с ИИ».",
    span: "md:col-span-1",
  },
] as const;

/** Bento tiles on dark — inspired by 21st bento grid id 9594 (materials only). */
export function Pillars() {
  return (
    <section
      className="landing-section landing-rounded-wrap bg-landing-dark text-landing-cream"
      data-landing-theme="black"
      aria-labelledby="pillars-title"
    >
      <div className="landing-rounded-inner mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h2 id="pillars-title" className="sr-only">
          Три опоры DocSaaS
        </h2>
        <ul className="grid gap-4 sm:gap-5 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <li
              key={p.kicker}
              className={`landing-reveal group relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-[border-color,transform] duration-300 hover:border-brand/35 sm:p-8 ${p.span}`}
            >
              <span
                className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-brand/10 blur-2xl transition-opacity group-hover:opacity-100"
                aria-hidden
              />
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.22em] text-landing-muted">
                0{i + 1}
              </p>
              <p className="relative mt-4 font-hero text-3xl font-bold tracking-tight text-brand sm:text-4xl">
                {p.kicker}
              </p>
              <h3 className="relative mt-4 font-display text-xl font-semibold text-landing-cream sm:text-2xl">
                {p.title}
              </h3>
              <p className="relative mt-3 text-sm leading-relaxed text-landing-muted sm:text-base">
                {p.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
