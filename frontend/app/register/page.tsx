"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, register, setToken } from "@/lib/api";
import { Field } from "@/components/Field";
import { StatusMessage } from "@/components/StatusMessage";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { FadeIn } from "@/components/ui/FadeIn";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShimmerButton } from "@/components/ui/ShimmerButton";

export default function RegisterPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError(
        "Нужно согласие на обработку персональных данных (закон 152-ФЗ).",
      );
      return;
    }
    if (password.length < 8) {
      setError("Пароль должен быть не короче 8 символов");
      return;
    }
    setLoading(true);
    try {
      const res = await register({
        org_name: orgName.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        consent: true,
        marketing_opt_in: marketingOptIn,
      });
      setToken(res.access_token);
      router.replace("/app");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 409
            ? "Этот email уже зарегистрирован. Войдите или укажите другой."
            : err.detail
          : "Не удалось зарегистрироваться. Проверьте API на порту 8000.";
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
              Регистрация компании
            </h1>
            <p className="mt-1 text-pretty text-sm text-ink-muted">
              Создайте аккаунт владельца — после входа откроется кабинет.
              Подтверждение почты не требуется.
            </p>

            <form
              className="mt-6 flex flex-col gap-4"
              method="post"
              onSubmit={onSubmit}
            >
              <Field
                label="Название компании"
                name="org_name"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="ООО Пример"
              />
              <Field
                label="Ваше имя"
                name="full_name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
              <Field
                label="Пароль"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint="Минимум 8 символов. Хранится только в зашифрованном виде."
              />
              <label className="flex items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 rounded border-white/20 bg-transparent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                />
                <span className="text-pretty text-ink-muted">
                  Я согласен(на) на обработку персональных данных в соответствии с{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold text-brand hover:underline"
                    target="_blank"
                  >
                    Политикой конфиденциальности
                  </Link>{" "}
                  (152-ФЗ). Письмо на почту для подтверждения не отправляется.
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 rounded border-white/20 bg-transparent"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                />
                <span className="text-pretty text-ink-muted">
                  Хочу получать на email новости, предложения и рекламные баннеры
                  DocSaaS. Можно отписаться в любой момент по ссылке в письме.
                  Это отдельно от согласия на обработку персональных данных.
                </span>
              </label>
              <StatusMessage message={error} />
              <ShimmerButton type="submit" loading={loading} className="w-full">
                Создать аккаунт
              </ShimmerButton>
            </form>

            <p className="mt-6 text-center text-sm text-ink-muted">
              Уже есть аккаунт?{" "}
              <Link
                href="/login"
                className="font-semibold text-brand hover:underline"
              >
                Войти
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
