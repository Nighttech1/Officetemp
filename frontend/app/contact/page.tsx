"use client";

import { FormEvent, useState } from "react";
import { ApiError, submitContact } from "@/lib/api";
import { Field } from "@/components/Field";
import { StatusMessage } from "@/components/StatusMessage";
import { FadeIn } from "@/components/ui/FadeIn";
import { ShimmerButton } from "@/components/ui/ShimmerButton";

/** C-183: полноценная страница контактов, не «остров» на чёрном */
export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (message.trim().length < 5) {
      setError("Сообщение слишком короткое — напишите хотя бы пару слов.");
      return;
    }
    setLoading(true);
    try {
      const res = await submitContact({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        website,
      });
      setOk(
        res.status === "emailed"
          ? "Спасибо! Сообщение отправлено."
          : "Спасибо! Сообщение принято и сохранено.",
      );
      setName("");
      setEmail("");
      setMessage("");
      setWebsite("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : "Не удалось отправить форму. Проверьте, что API запущен.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-landing-cream text-landing-ink" data-landing>
      <main id="main" tabIndex={-1} className="outline-none">
        <section className="relative overflow-hidden border-b border-landing-ink/10 bg-landing-dark text-white">
          <div
            className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-brand/10 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <FadeIn>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
                Контакты
              </p>
              <h1 className="mt-3 max-w-2xl font-hero text-[clamp(2rem,5vw,3.5rem)] font-bold leading-tight tracking-tight">
                Напишите нам о задаче с документами
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
                Ответим по кабинету, ИУЛ, накладным и пилоту на ваших шаблонах.
                Без «чёрной пустоты» — форма на светлой плоскости ниже.
              </p>
            </FadeIn>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:px-8">
          <FadeIn>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Как связаться
            </h2>
            <ul className="mt-6 space-y-4 text-sm leading-relaxed text-landing-ink/75">
              <li className="rounded-2xl border border-landing-ink/10 bg-white p-5 shadow-sm">
                <p className="font-semibold text-landing-ink">Форма справа</p>
                <p className="mt-1">
                  Коротко опишите задачу — ответим на указанный email.
                </p>
              </li>
              <li className="rounded-2xl border border-landing-ink/10 bg-white p-5 shadow-sm">
                <p className="font-semibold text-landing-ink">Кабинет</p>
                <p className="mt-1">
                  Уже есть аккаунт — зайдите через «Личный кабинет» в шапке.
                </p>
              </li>
              <li className="rounded-2xl border border-landing-ink/10 bg-white p-5 shadow-sm">
                <p className="font-semibold text-landing-ink">ИУЛ и накладные</p>
                <p className="mt-1">
                  Открываются из меню «Решения» — тот же контур DocSaaS.
                </p>
              </li>
            </ul>
          </FadeIn>

          <FadeIn delay={0.08}>
            <div className="rounded-3xl border border-landing-ink/10 bg-white p-6 shadow-[0_20px_60px_rgba(17,17,17,0.08)] sm:p-8">
              <h2 className="font-display text-lg font-semibold">Сообщение</h2>
              <form
                className="relative mt-5 flex flex-col gap-4"
                method="post"
                onSubmit={onSubmit}
              >
                <div className="hp-field" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                <Field
                  label="Имя"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Иван Иванов"
                />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.ru"
                />
                <label className="flex w-full flex-col gap-1.5" htmlFor="message">
                  <span className="text-sm font-medium text-ink">Сообщение</span>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Как мы можем помочь?"
                    className="field-control !border-landing-ink/20 !bg-white !text-black"
                  />
                </label>
                <StatusMessage message={error} />
                <StatusMessage message={ok} tone="ok" />
                <ShimmerButton type="submit" loading={loading} className="w-full">
                  Отправить
                </ShimmerButton>
              </form>
            </div>
          </FadeIn>
        </section>
      </main>
    </div>
  );
}
