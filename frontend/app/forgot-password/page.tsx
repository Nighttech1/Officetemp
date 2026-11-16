"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ApiError, forgotPassword } from "@/lib/api";
import { Field } from "@/components/Field";
import { StatusMessage } from "@/components/StatusMessage";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { FadeIn } from "@/components/ui/FadeIn";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShimmerButton } from "@/components/ui/ShimmerButton";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setDevLink(null);
    try {
      const res = await forgotPassword({ email: email.trim() });
      setDone(true);
      if (res.debug_reset_url) {
        setDevLink(res.debug_reset_url);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 429
            ? "Слишком много запросов. Подождите немного и попробуйте снова."
            : err.detail
          : "Не удалось отправить запрос. Проверьте интернет и API.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuroraBackground>
      <main
        id="main"
        tabIndex={-1}
        className="flex min-h-dvh items-center justify-center px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] outline-none"
      >
        <FadeIn className="w-full max-w-md">
          <GlassCard>
            <p className="font-display text-2xl font-semibold text-brand">
              DocSaaS
            </p>
            <h1 className="mt-2 text-balance text-xl font-semibold text-ink">
              Восстановление пароля
            </h1>
            <p className="mt-1 text-pretty text-sm text-ink-muted">
              Укажите email аккаунта — если он есть в системе, мы отправим ссылку
              для сброса пароля (или покажем её здесь в режиме разработки).
            </p>

            {done ? (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-ink" role="status">
                  Если аккаунт с таким email существует, инструкции отправлены.
                  Проверьте почту (и папку «Спам»).
                </p>
                {devLink ? (
                  <p className="break-all rounded-lg bg-surface-muted p-3 text-xs text-ink-muted">
                    Режим разработки — ссылка:{" "}
                    <Link
                      href={devLink}
                      className="font-semibold text-brand hover:underline"
                    >
                      открыть сброс пароля
                    </Link>
                  </p>
                ) : null}
                <p className="text-center text-sm text-ink-muted">
                  <Link
                    href="/login"
                    className="font-semibold text-brand hover:underline"
                  >
                    Вернуться ко входу
                  </Link>
                </p>
              </div>
            ) : (
              <form
                className="mt-6 flex flex-col gap-4"
                method="post"
                onSubmit={onSubmit}
              >
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
                <StatusMessage message={error} />
                <ShimmerButton type="submit" loading={loading} className="w-full">
                  Отправить ссылку
                </ShimmerButton>
              </form>
            )}

            {!done ? (
              <p className="mt-6 text-center text-sm text-ink-muted">
                Вспомнили пароль?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-brand hover:underline"
                >
                  Войти
                </Link>
              </p>
            ) : null}
          </GlassCard>
        </FadeIn>
      </main>
    </AuroraBackground>
  );
}
