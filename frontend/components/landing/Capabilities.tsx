"use client";

import { useEffect, useState } from "react";

const ITEMS = [
  {
    title: "Шаблоны Word",
    body: "Плейсхолдеры docxtpl — поля, таблицы, условия. Ваша вёрстка остаётся эталоном.",
  },
  {
    title: "Источники данных",
    body: "Excel, Google Sheets, Яндекс Таблицы — стыковка колонок с тегами до генерации.",
  },
  {
    title: "Пакетная очередь",
    body: "DOCX и PDF через Celery: сотни файлов без ручной сборки на ноутбуке.",
  },
  {
    title: "ZIP на выходе",
    body: "Скачиваете результат одним архивом, когда пакет готов.",
  },
  {
    title: "Кабинет команды",
    body: "Шаблоны, маппинг, задачи и превью в одном контуре.",
  },
  {
    title: "152‑ФЗ",
    body: "Персональные данные без «облака ради облака» — изоляция организаций.",
  },
] as const;

/**
 * C-174: автопереключение + hover без клика;
 * высота списка фиксирована (контент в отдельной панели) — страница не шатается.
 */
export function Capabilities() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % ITEMS.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <section
      id="capabilities"
      className="landing-section scroll-mt-20 bg-landing-dark px-4 py-16 text-landing-cream sm:px-6 sm:py-20 lg:px-8"
      data-landing-theme="black"
      aria-labelledby="capabilities-title"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
        <div className="landing-reveal">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-brand">
            Возможности
          </p>
          <h2
            id="capabilities-title"
            className="font-hero text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Что делает DocSaaS
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/90">
            Не чат и не «ещё один AI». Наведите на пункт слева — справа
            подсветится описание. Без клика, высота блока стабильна.
          </p>
        </div>

        <div
          className="landing-reveal grid gap-4 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] sm:gap-5"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <ul
            className="flex flex-col gap-1.5"
            role="tablist"
            aria-label="Возможности"
          >
            {ITEMS.map((item, i) => {
              const on = active === i;
              return (
                <li key={item.title} className="min-h-[2.75rem]">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={on}
                    tabIndex={0}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    className={`relative flex h-11 w-full items-center gap-3 overflow-hidden rounded-xl border px-3 text-left transition-[border-color,background-color,color] duration-300 sm:h-12 sm:px-4 ${
                      on
                        ? "border-brand/50 bg-white/[0.06] text-landing-cream"
                        : "border-white/10 bg-transparent text-landing-cream/75 hover:border-white/25"
                    }`}
                  >
                    {on ? (
                      <span
                        className="absolute inset-y-0 left-0 w-1 bg-brand"
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={`shrink-0 font-mono text-[10px] tracking-widest ${on ? "text-brand" : "text-white/70"}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate font-display text-sm font-semibold sm:text-base">
                      {item.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div
            className="relative min-h-[11.5rem] overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] p-5 sm:min-h-[13rem] sm:p-6"
            role="tabpanel"
            aria-live="polite"
          >
            {ITEMS.map((item, i) => (
              <div
                key={item.title}
                className={`absolute inset-0 flex flex-col justify-center p-5 transition-[opacity,transform] duration-500 ease-out sm:p-6 ${
                  active === i
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0"
                }`}
              >
                <p className="font-mono text-[10px] tracking-widest text-brand">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-landing-cream sm:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/90 sm:text-base">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
