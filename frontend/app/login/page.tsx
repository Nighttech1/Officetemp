"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, login, setToken } from "@/lib/api";
import { Field } from "@/components/Field";
import { StatusMessage } from "@/components/StatusMessage";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { FadeIn } from "@/components/ui/FadeIn";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShimmerButton } from "@/components/ui/ShimmerButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ email: email.trim(), password });
      setToken(res.access_token);
      router.replace("/app");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 401
            ? "Неверный логин или пароль"
            : err.detail
          : "Не удалось войти. Проверьте интернет и API.";
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
              Вход в кабинет
            </h1>
            <p className="mt-1 text-pretty text-sm text-ink-muted">
              Временные входы: <span className="text-ink-soft">admin1</span> /{" "}
              <span className="text-ink-soft">admin1</span> или{" "}
              <span className="text-ink-soft">admin2</span> /{" "}
              <span className="text-ink-soft">admin2</span>.
            </p>

            <form
              className="mt-6 flex flex-col gap-4"
              method="post"
              onSubmit={onSubmit}
            >
              <Field
                label="Логин"
                name="email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin1"
              />
              <Field
                label="Пароль"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin1"
              />
              <StatusMessage message={error} />
              <p className="-mt-1 text-right text-sm">
                <Link
                  href="/forgot-password"
                  className="text-brand hover:underline"
                >
                  Забыли пароль?
                </Link>
              </p>
              <ShimmerButton type="submit" loading={loading} className="w-full">
                Войти
              </ShimmerButton>
            </form>

            <p className="mt-6 text-center text-sm text-ink-muted">
              Нет аккаунта?{" "}
              <Link
                href="/register"
                className="font-semibold text-brand hover:underline"
              >
                Зарегистрировать компанию
              </Link>
            </p>
            <p className="mt-3 text-center text-sm text-ink-muted">
              <Link href="/contact" className="hover:text-brand hover:underline">
                Связаться с нами
              </Link>
            </p>
          </GlassCard>
        </FadeIn>
      </main>
    </AuroraBackground>
  );
}
