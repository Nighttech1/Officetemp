const FEATURES = [
  {
    title: "Шаблон Word",
    body: "Загрузите .docx с плейсхолдерами — макет договора или сертификата остаётся вашим.",
    visual: "showcase-visual--template",
  },
  {
    title: "Маппинг Excel",
    body: "Свяжите колонки Excel, Google Sheets или Яндекс Таблиц с полями шаблона.",
    visual: "showcase-visual--map",
  },
  {
    title: "Очередь Celery",
    body: "Пакетная генерация уходит в фон: сотни и тысячи файлов без зависания браузера.",
    visual: "showcase-visual--queue",
  },
  {
    title: "ZIP архив",
    body: "Скачайте готовый ZIP с DOCX и PDF — один клик после завершения задачи.",
    visual: "showcase-visual--zip",
  },
  {
    title: "152‑ФЗ",
    body: "Персональные данные обрабатываются в контуре, рассчитанном на требования РФ.",
    visual: "showcase-visual--law",
  },
] as const;

export function ShowcaseStrip() {
  return (
    <section
      className="landing-section landing-showcase bg-landing-cream px-4 py-20 text-landing-dark sm:px-6 sm:py-28 lg:px-8"
      aria-labelledby="showcase-title"
    >
      <div className="mx-auto max-w-6xl">
        <div className="landing-reveal mb-10 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.28em] text-landing-dark/50">
              Сценарии
            </p>
            <h2
              id="showcase-title"
              className="font-hero text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              От шаблона до архива
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-landing-dark/60">
            Пять шагов одного контура: от вашего Word до ZIP с готовыми DOCX и
            PDF — без ручной сборки.
          </p>
        </div>
      </div>

      {/* Desktop: pin + horizontal rail (wired in LandingMotion). Mobile: vertical stack. */}
      <div
        className="landing-showcase-pin mx-auto max-w-6xl"
        data-showcase-pin
      >
        <div className="landing-showcase-stage">
          <div
            className="landing-showcase-rail"
            data-showcase-rail
          >
            {FEATURES.map((f, i) => (
              <article
                key={f.title}
                data-showcase-card
                data-index={i}
                className="landing-reveal showcase-card flex shrink-0 flex-col"
              >
                <div
                  className={`showcase-visual mb-5 aspect-[4/3] overflow-hidden rounded-sm ${f.visual}`}
                  aria-hidden
                />
                <p className="mb-1 font-mono text-[10px] tracking-widest text-landing-dark/40">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="font-hero text-lg font-semibold tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-landing-dark/65">
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </div>
        <p
          className="landing-showcase-progress mt-8 hidden font-mono text-xs tracking-[0.28em] text-landing-dark/45 md:block"
          aria-hidden
        >
          <span data-showcase-current>01</span>
          <span>/</span>
          <span>{String(FEATURES.length).padStart(2, "0")}</span>
        </p>
      </div>
    </section>
  );
}
