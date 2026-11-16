import Link from "next/link";

export const metadata = {
  title: "Политика конфиденциальности | DocSaaS",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-ink">
      <p className="text-sm text-ink-muted">
        <Link href="/" className="text-brand hover:underline">
          ← На главную
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-semibold">
        Политика конфиденциальности (152-ФЗ)
      </h1>
      <p className="mt-4 text-pretty text-sm leading-relaxed text-ink-muted">
        Этот текст объясняет простыми словами, какие данные мы обрабатываем в
        сервисе DocSaaS и зачем. Это черновик для продукта; перед боевым запуском
        его нужно согласовать с юристом и указать реквизиты оператора.
      </p>

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Что мы собираем</h2>
        <ul className="list-disc space-y-1 pl-5 text-ink-muted">
          <li>Email, имя и пароль при регистрации (пароль хранится только как защищённый отпечаток — hash).</li>
          <li>Название организации и рабочие данные кабинета: проекты, черновики ИУЛ и накладных, библиотека подписей.</li>
          <li>Исходные PDF чертежей, с которых делают ИУЛ, на сервер не загружаем.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Зачем</h2>
        <p className="text-ink-muted">
          Чтобы вы могли войти в личный кабинет с любого браузера и видеть свои
          проекты. Правовое основание — ваше согласие при регистрации и договор
          оказания услуг.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Где храним</h2>
        <p className="text-ink-muted">
          Персональные данные граждан РФ храним на серверах в Российской
          Федерации (PostgreSQL и файловое хранилище). Копия рабочих данных также
          может дублироваться в браузере (localStorage) для быстрого доступа.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Восстановление пароля</h2>
        <p className="text-ink-muted">
          Закон 152-ФЗ не требует обязательного подтверждения email при
          регистрации. Для сброса пароля мы отправляем на указанный при
          регистрации email одноразовую ссылку (действует около часа). В базе
          хранится только защищённый отпечаток ссылки, не сам пароль и не
          открытый токен. Без настроенной почты (SMTP) на сервере разработки
          ссылка может попасть в служебный журнал — на боевом сервере нужен
          SMTP.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Рекламные письма и баннеры</h2>
        <p className="text-ink-muted">
          Предложения, новости и рекламные баннеры отправляем только если вы
          отдельно согласились на это при регистрации или в настройках профиля.
          Это не то же самое, что согласие на обработку персональных данных.
          В каждом таком письме есть ссылка «Отписаться». Без вашего согласия
          маркетинговые письма не шлём.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Ваши права</h2>
        <p className="text-ink-muted">
          Вы можете запросить выгрузку или удаление учётной записи. Напишите нам
          через форму «Связаться» — оператор обязан рассмотреть обращение.
        </p>
      </section>

      <p className="mt-10 text-xs text-ink-muted">
        Версия черновика: 2026-09-30 · W-64
      </p>
    </main>
  );
}
