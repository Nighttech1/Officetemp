"use client";

import { useId, useState } from "react";

const FAQ = [
  {
    q: "Нужно ли менять привычный Word-шаблон?",
    a: "Нет. Загружаете свой DOCX — DocSaaS подставляет данные в вашу вёрстку, а не перерисовывает документ с нуля. Превью и скачанный файл сверяются с эталоном.",
  },
  {
    q: "Откуда берутся данные для заполнения?",
    a: "Из Excel/CSV, Google Sheets или Яндекс Таблиц. Колонки стыкуются с тегами шаблона наглядно — до запуска пакета видно, что куда попадёт.",
  },
  {
    q: "Как это стыкуется с 152‑ФЗ?",
    a: "Контур рассчитан на изоляцию организаций (tenant), согласие на обработку ПДн и контролируемый доступ. Не храним лишние PDF ИУЛ на сервере без явной политики — детали в кабинете и политике продукта.",
  },
  {
    q: "Сколько стоит и как начать?",
    a: "Старт — регистрация и пилот на ваших шаблонах. Коммерческие условия после демо: без скрытых «AI-подписок» — платите за контур генерации документов.",
  },
  {
    q: "Что на выходе: один файл или пакет?",
    a: "И то, и другое. Одиночная генерация DOCX/PDF или очередь Celery на сотни строк таблицы с выгрузкой ZIP.",
  },
] as const;

/** C-177: раскрытие только по hover; плавное выпадение сохранено */
export function FaqSection() {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      className="landing-section bg-landing-cream text-landing-ink"
      data-landing-theme="cream"
      id="faq"
      aria-labelledby="faq-title"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:px-8">
        <div className="landing-reveal lg:pt-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            Доверие
          </p>
          <h2
            id="faq-title"
            className="mt-3 font-hero text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight tracking-tight"
          >
            Вопросы до передачи заказчику
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-landing-ink/65">
            Наведите на вопрос — ответ выедет сам. Уберите курсор — спрячется.
          </p>
        </div>

        <ul className="space-y-3">
          {FAQ.map((item, i) => {
            const panelId = `${baseId}-panel-${i}`;
            const btnId = `${baseId}-btn-${i}`;
            const isOpen = open === i;
            return (
              <li
                key={item.q}
                className="landing-reveal faq-shimmer-card group relative overflow-hidden rounded-2xl border border-landing-ink/10 bg-white/80 shadow-[0_1px_0_rgba(17,17,17,0.04)] backdrop-blur-sm transition-[border-color,box-shadow] duration-300 hover:border-brand/35 hover:shadow-[0_12px_40px_rgba(34,197,94,0.1)]"
                onMouseEnter={() => setOpen(i)}
                onMouseLeave={() => setOpen(null)}
              >
                <h3>
                  <button
                    id={btnId}
                    type="button"
                    className="relative z-[1] flex w-full cursor-default items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    tabIndex={0}
                    onFocus={() => setOpen(i)}
                    onBlur={() => setOpen(null)}
                  >
                    <span className="font-display text-base font-semibold tracking-tight text-landing-ink sm:text-lg">
                      {item.q}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-landing-ink/15 text-lg leading-none text-landing-ink/70 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "rotate-45 border-transparent bg-brand text-landing-dark" : "group-hover:border-brand/40"}`}
                      aria-hidden
                    >
                      +
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  className="relative z-[1] grid transition-[grid-template-rows] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    transitionDuration: "550ms",
                  }}
                >
                  <div className="overflow-hidden">
                    <p
                      className="border-t border-landing-ink/8 px-5 pb-5 pt-4 text-sm leading-relaxed text-landing-ink/70 sm:px-6 sm:pb-6 sm:text-base"
                      style={{
                        opacity: isOpen ? 1 : 0,
                        transform: isOpen ? "translateY(0)" : "translateY(-6px)",
                        transition:
                          "opacity 450ms cubic-bezier(0.22,1,0.36,1), transform 450ms cubic-bezier(0.22,1,0.36,1)",
                        transitionDelay: isOpen ? "80ms" : "0ms",
                      }}
                    >
                      {item.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
