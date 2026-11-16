"use client";

import { FormEvent, useState } from "react";
import { ApiError, submitContact } from "@/lib/api";

/** C-183: без Регистрация / Полная форма / mailto */
export function ContactCTA() {
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
      setError("Напишите пару слов о задаче — так мы быстрее ответим.");
      return;
    }
    setLoading(true);
    try {
      await submitContact({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        website,
      });
      setOk("Сообщение отправлено. Ответим в рабочие дни.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : "Не удалось отправить. Попробуйте позже.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="contact"
      className="landing-section scroll-mt-20 bg-landing-dark px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8"
      data-landing-theme="black"
      aria-labelledby="contact-title"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="landing-reveal">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-brand">
            Контакт
          </p>
          <h2
            id="contact-title"
            className="max-w-3xl font-hero text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-tight tracking-tight text-white"
          >
            Готовы убрать ручную сборку документов из процесса?
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90">
            Опишите задачу в трёх строках справа — ответим на email, который
            укажете в форме.
          </p>
        </div>

        <form
          className="landing-reveal space-y-4 rounded-2xl border border-white/12 bg-white/[0.04] p-5 sm:p-6"
          onSubmit={onSubmit}
          noValidate
        >
          <p className="text-sm text-white/85">Короткое сообщение</p>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white">
              Имя
            </span>
            <input
              className="field-control !border-white/20 !bg-white/10 !text-white placeholder:!text-white/40"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white">
              Email
            </span>
            <input
              className="field-control !border-white/20 !bg-white/10 !text-white placeholder:!text-white/40"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white">
              Сообщение
            </span>
            <textarea
              className="field-control min-h-[7rem] resize-y !border-white/20 !bg-white/10 !text-white placeholder:!text-white/40"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </label>
          <input
            className="hp-field"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            aria-hidden
          />
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          {ok ? (
            <p className="text-sm text-ok" role="status">
              {ok}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-touch w-full items-center justify-center rounded-full bg-brand px-6 text-sm font-semibold text-landing-dark transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {loading ? "Отправляем…" : "Отправить"}
          </button>
        </form>
      </div>
    </section>
  );
}
