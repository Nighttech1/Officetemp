const STEPS = [
  {
    n: "01",
    title: "Загрузить",
    body: "Шаблон Word и таблица с данными — в кабинет за минуту.",
  },
  {
    n: "02",
    title: "Связать",
    body: "Сопоставьте теги шаблона с колонками Excel, Google или Яндекс.",
  },
  {
    n: "03",
    title: "Сгенерировать",
    body: "Очередь Celery собирает DOCX и PDF по каждой строке данных.",
  },
  {
    n: "04",
    title: "Скачать",
    body: "Получите ZIP-архив готовых документов — без ручной сборки.",
  },
] as const;

export function Process() {
  return (
    <section
      id="method"
      className="landing-section landing-process scroll-mt-20 bg-landing-dark px-4 py-20 text-landing-cream sm:px-6 sm:py-28 lg:px-8"
      aria-labelledby="process-title"
    >
      <div className="mx-auto max-w-6xl">
        <p className="landing-reveal mb-3 text-xs uppercase tracking-[0.28em] text-landing-muted">
          Метод
        </p>
        <h2
          id="process-title"
          className="landing-reveal mb-12 font-hero text-3xl font-semibold tracking-tight sm:mb-16 sm:text-4xl"
        >
          Четыре шага до пакета документов
        </h2>

        <ol className="landing-process-stack" data-process-stack>
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="landing-reveal landing-process-card"
              data-process-card
            >
              <span className="landing-process-ghost" aria-hidden>
                {step.n}
              </span>
              <div className="landing-process-card-body">
                <span className="font-mono text-xs tracking-widest text-brand">
                  {step.n}
                </span>
                <h3 className="mt-4 font-hero text-2xl font-semibold tracking-tight sm:text-3xl">
                  {step.title}
                </h3>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-landing-muted sm:text-base">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
