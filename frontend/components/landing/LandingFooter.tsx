import Link from "next/link";

const COLS = [
  {
    title: "Продукт",
    links: [
      { href: "/#method", label: "Как работает" },
      { href: "/#about", label: "О сервисе" },
      { href: "/#services", label: "Услуги" },
      { href: "/#capabilities", label: "Возможности" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Кабинет",
    links: [
      { href: "/login", label: "Войти" },
      { href: "/register", label: "Регистрация" },
      { href: "/app", label: "Личный кабинет" },
      { href: "/app/documents/info-sheet", label: "ИУЛ" },
      { href: "/app/documents/waybills", label: "Накладные" },
      { href: "/app/templates", label: "Шаблоны" },
    ],
  },
  {
    title: "Контур",
    links: [
      { href: "/", label: "Главная" },
      { href: "/contact", label: "Контакт" },
      { href: "/register", label: "Пилот на ваших DOCX" },
    ],
  },
] as const;

/** C-183: без кнопки «Начать бесплатно»; белый текст на тёмном */
export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-landing-dark text-white">
      <div
        className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-brand/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 top-0 h-48 w-48 rounded-full bg-brand/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)] lg:gap-16">
          <div>
            <p className="font-display text-2xl tracking-tight text-white">
              DocSaaS
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/90">
              Генерация DOCX и PDF из Word и таблиц. Для команд, которым важна
              вёрстка и 152‑ФЗ — без срыва макета.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {COLS.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        prefetch={
                          l.href.startsWith("/app/documents/") ? true : undefined
                        }
                        className="footer-link-underline relative inline-block text-sm text-white/85 transition-colors hover:text-white"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/70">
            © {new Date().getFullYear()} DocSaaS · документы без срыва вёрстки
          </p>
          <p className="text-xs text-white/60">
            Word · Excel · Google · Яндекс · Celery · 152‑ФЗ
          </p>
        </div>
      </div>
    </footer>
  );
}
