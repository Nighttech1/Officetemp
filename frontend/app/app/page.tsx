"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, fetchMe, type MeResponse } from "@/lib/api";
import { StatusMessage } from "@/components/StatusMessage";
import { FadeIn } from "@/components/ui/FadeIn";
import { GlassCard } from "@/components/ui/GlassCard";
const roleLabels: Record<string, string> = {
  owner: "Владелец",
  admin: "Администратор",
  member: "Участник",
  viewer: "Наблюдатель",
};

export default function ProfilePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMe();
        if (!cancelled) setMe(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.detail
              : "Не удалось загрузить профиль",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FadeIn className="flex flex-col gap-6">
      <div>
        <h1 className="text-balance text-2xl font-semibold text-ink">Профиль</h1>
        <p className="mt-1 text-pretty text-sm text-ink-muted">
          Данные вашего аккаунта в DocSaaS.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Загружаем профиль…</p>
      ) : null}

      <StatusMessage message={error} />

      {me ? (
        <GlassCard className="p-5 sm:p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Имя
              </dt>
              <dd className="mt-1 text-base text-ink">{me.full_name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Email
              </dt>
              <dd className="mt-1 break-all text-base text-ink">{me.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Роль
              </dt>
              <dd className="mt-1 text-base text-ink">
                {roleLabels[me.role] ?? me.role}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Статус
              </dt>
              <dd className="mt-1 text-base text-ink">
                {me.is_active ? "Активен" : "Отключён"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                ID организации
              </dt>
              <dd className="mt-1 break-all font-mono text-sm text-ink-soft tabular-nums">
                {me.organization_id}
              </dd>
            </div>
          </dl>
        </GlassCard>
      ) : null}

      <GlassCard className="p-5">
        <h2 className="text-base font-semibold text-ink">Быстрый старт</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-pretty text-sm text-ink-soft">
          <li>Загрузите Word-шаблон с тегами вроде {"{{ ClientName }}"}.</li>
          <li>
            На экране «Маппинг» загрузите Excel и свяжите колонки с тегами.
          </li>
          <li>На «Генерации» скачайте готовый DOCX или PDF.</li>
        </ol>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/app/templates"
            className="shimmer-btn relative inline-flex min-h-touch min-w-touch items-center justify-center overflow-hidden rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-brand-hover hover:shadow-glow"
          >
            <span className="relative z-10">К шаблонам</span>
          </Link>
          <Link
            href="/app/mapper"
            className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-xl border border-line bg-surface-card/80 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-muted"
          >
            К маппингу
          </Link>
        </div>
      </GlassCard>
    </FadeIn>
  );
}
