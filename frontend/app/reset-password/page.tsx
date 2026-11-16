"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, resetPassword } from "@/lib/api";
import { Field } from "@/components/Field";
import { StatusMessage } from "@/components/StatusMessage";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { FadeIn } from "@/components/ui/FadeIn";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShimmerButton } from "@/components/ui/ShimmerButton";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = useMemo(() => (params.get("token") || "").trim(), [params]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("В ссылке нет токена. Запросите восстановление ещё раз.");
      return;
    }
    if (password.length < 8) {
      setError("Пароль должен быть не короче 8 символов");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token, new_password: password });
      setDone(true);
      setTimeout(() => router.replace("/login"), 1800);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 400
            ? "Ссылка недействительна или устарела. Запросите новую."
            : err.detail
          : "Не удалось сменить пароль. Проверьте интернет и API.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard>
      <p className="font-display text-2xl font-semibold text-brand">DocSaaS</p>
      <h1 className="mt-2 text-balance text-xl font-semibold text-ink">
        Новый пароль
      </h1>
      <p className="mt-1 text-pretty text-sm text-ink-muted">
        Придумайте новый пароль для входа в кабинет. Ссылка одноразовая и
        действует ограниченное время.
      </p>

      {done ? (
        <p className="mt-6 text-sm text-ink" role="status">
          Пароль обновлён. Переходим на страницу входа…
        </p>
      ) : (
        <form
          className="mt-6 flex flex-col gap-4"
          method="post"
          onSubmit={onSubmit}
        >
          <Field
            label="Новый пароль"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="минимум 8 символов"
          />
          <Field
            label="Ещё раз"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="повторите пароль"
          />
          <StatusMessage message={error} />
          <ShimmerButton type="submit" loading={loading} className="w-full">
            Сохранить пароль
          </ShimmerButton>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Ко входу
        </Link>
        {" · "}
        <Link
          href="/forgot-password"
          className="font-semibold text-brand hover:underline"
        >
          Запросить ссылку снова
        </Link>
      </p>
    </GlassCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuroraBackground>
      <main
        id="main"
        tabIndex={-1}
        className="flex min-h-dvh items-center justify-center px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] outline-none"
      >
        <FadeIn className="w-full max-w-md">
          <Suspense
            fallback={
              <GlassCard>
                <p className="text-sm text-ink-muted">Загрузка…</p>
              </GlassCard>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </FadeIn>
      </main>
    </AuroraBackground>
  );
}
