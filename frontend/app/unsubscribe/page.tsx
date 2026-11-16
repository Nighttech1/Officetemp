"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ApiError, unsubscribeMarketing } from "@/lib/api";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { FadeIn } from "@/components/ui/FadeIn";
import { GlassCard } from "@/components/ui/GlassCard";

function UnsubscribeInner() {
  const params = useSearchParams();
  const token = useMemo(() => (params.get("token") || "").trim(), [params]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("В ссылке нет кода отписки. Откройте ссылку из письма.");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    unsubscribeMarketing({ token })
      .then((res) => {
        if (cancelled) return;
        setStatus("done");
        setMessage(
          res.unsubscribed
            ? "Вы отписаны от рекламных писем и предложений DocSaaS."
            : "Если ссылка была действительна, рассылка для вас отключена.",
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          err instanceof ApiError
            ? err.detail
            : "Не удалось отписаться. Попробуйте позже или напишите нам.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <GlassCard>
      <p className="font-display text-2xl font-semibold text-brand">DocSaaS</p>
      <h1 className="mt-2 text-balance text-xl font-semibold text-ink">
        Отписка от рассылки
      </h1>
      <p className="mt-4 text-sm text-ink-muted" role="status">
        {status === "loading" ? "Отписываем…" : message}
      </p>
      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link href="/" className="font-semibold text-brand hover:underline">
          На главную
        </Link>
        {" · "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Войти
        </Link>
      </p>
    </GlassCard>
  );
}

export default function UnsubscribePage() {
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
            <UnsubscribeInner />
          </Suspense>
        </FadeIn>
      </main>
    </AuroraBackground>
  );
}
