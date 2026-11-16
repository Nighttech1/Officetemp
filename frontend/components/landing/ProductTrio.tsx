const TRIO = [
  {
    title: "Шаблон",
    body: "Загрузка Word, разбор тегов, превью вёрстки. Система видит поля так же, как вы видите документ.",
  },
  {
    title: "Данные",
    body: "Excel / Google Sheets / Яндекс Таблицы. Сопоставление колонок с тегами без ручного копипаста.",
  },
  {
    title: "Генерация",
    body: "Один файл или пакет в очередь. Скачиваете DOCX, PDF или ZIP — и сверяете с эталоном.",
  },
] as const;

/** C-182: сразу после Hero, высота ×2 */
export function ProductTrio() {
  return (
    <section
      className="landing-section bg-landing-dark text-landing-cream"
      data-landing-theme="black"
      id="method"
      aria-labelledby="trio-title"
    >
      <div className="mx-auto flex min-h-[28rem] max-w-6xl flex-col justify-center px-4 py-20 sm:min-h-[36rem] sm:px-6 sm:py-28 lg:min-h-[42rem] lg:px-8 lg:py-32">
        <h2
          id="trio-title"
          className="landing-reveal max-w-3xl font-hero text-[clamp(1.75rem,4vw,3rem)] font-bold leading-tight tracking-tight"
        >
          Ускорьте выпуск документов агентным контуром DocSaaS
        </h2>
        <p className="landing-reveal mt-5 max-w-2xl text-base leading-relaxed text-white sm:text-lg">
          Три входа. Один результат: готовый файл с сохранённой вёрсткой.
        </p>

        <ul className="mt-12 grid flex-1 gap-5 sm:mt-14 sm:gap-6 md:grid-cols-3">
          {TRIO.map((item, i) => (
            <li
              key={item.title}
              className="landing-reveal group relative flex min-h-[14rem] flex-col overflow-hidden rounded-2xl border border-white/12 bg-white/[0.035] p-6 transition-[border-color,background-color] duration-300 hover:border-brand/40 hover:bg-white/[0.055] sm:min-h-[16rem] sm:p-8"
            >
              <span
                className="font-hero text-5xl font-bold leading-none tracking-tight text-white/15 transition-colors group-hover:text-brand/30 sm:text-6xl"
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-brand sm:text-2xl">
                {item.title}
              </h3>
              <p className="mt-3 flex-1 text-base leading-relaxed text-white/90">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
