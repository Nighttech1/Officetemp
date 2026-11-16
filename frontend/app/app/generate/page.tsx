"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiError, generateDocx, generatePdf } from "@/lib/api";
import {
  buildContext,
  loadTemplateFile,
  loadWorkspace,
  saveWorkspace,
  type WorkspaceState,
} from "@/lib/workspace";
import { Button } from "@/components/Button";
import { StatusMessage } from "@/components/StatusMessage";
import { FadeIn } from "@/components/ui/FadeIn";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShimmerButton } from "@/components/ui/ShimmerButton";

type DownloadState = {
  blob: Blob;
  filename: string;
  kind: "docx" | "pdf";
} | null;

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function GeneratePage() {
  const [ws, setWs] = useState<WorkspaceState | null>(null);
  const [templateReady, setTemplateReady] = useState(false);
  const [status, setStatus] = useState<string>("Ожидание");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"docx" | "pdf" | null>(null);
  const [download, setDownload] = useState<DownloadState>(null);

  useEffect(() => {
    const state = loadWorkspace();
    setWs(state);
    void loadTemplateFile().then((f) => setTemplateReady(!!f));
  }, []);

  const contextPreview = useMemo(() => {
    if (!ws) return {};
    return buildContext(ws);
  }, [ws]);

  const canGenerate =
    !!ws &&
    templateReady &&
    ws.tags.length > 0 &&
    Object.values(ws.mapping).some(Boolean) &&
    ws.rows.length > 0;

  function setRowIndex(index: number) {
    if (!ws) return;
    const next = { ...ws, rowIndex: index };
    setWs(next);
    saveWorkspace(next);
  }

  async function run(kind: "docx" | "pdf") {
    if (!ws) return;
    setError(null);
    setDownload(null);
    setBusy(kind);
    setStatus(kind === "docx" ? "Создаём Word…" : "Создаём PDF…");
    try {
      const file = await loadTemplateFile();
      if (!file) {
        throw new Error(
          "Файл шаблона не найден в браузере. Вернитесь в «Маппинг» и загрузите .docx ещё раз.",
        );
      }
      const context = buildContext(ws);
      const result =
        kind === "docx"
          ? await generateDocx(file, context)
          : await generatePdf(file, context);
      setDownload({ ...result, kind });
      setStatus("Готово");
      triggerDownload(result.blob, result.filename);
    } catch (err) {
      setStatus("Ошибка");
      setError(
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Генерация не удалась",
      );
    } finally {
      setBusy(null);
    }
  }

  if (!ws) {
    return <p className="text-sm text-ink-muted">Загрузка…</p>;
  }

  return (
    <FadeIn className="flex flex-col gap-6">
      <div>
        <h1 className="text-balance text-2xl font-semibold text-ink">
          Генерация
        </h1>
        <p className="mt-1 text-pretty text-sm text-ink-muted">
          Подставьте данные из выбранной строки в шаблон и скачайте документ.
        </p>
      </div>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink">Контекст</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted">Шаблон</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {ws.templateName || "— не выбран —"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Таблица</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {ws.dataFilename || "— не загружена —"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Файл шаблона в браузере</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {templateReady ? "Есть" : "Нет — загрузите на «Маппинге»"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Статус</dt>
            <dd className="mt-0.5 font-medium text-ink">{status}</dd>
          </div>
        </dl>

        {ws.rows.length > 0 ? (
          <label className="mt-4 flex max-w-xs flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Строка данных</span>
            <select
              className="min-h-touch rounded-xl border border-line bg-surface-muted/80 px-3 text-base text-ink tabular-nums"
              value={ws.rowIndex}
              onChange={(e) => setRowIndex(Number(e.target.value))}
            >
              {ws.rows.map((_, i) => (
                <option key={i} value={i}>
                  Строка {i + 1}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface-muted/60 p-3">
          <p className="text-xs font-medium uppercase text-ink-muted">
            Предпросмотр подстановок
          </p>
          <pre className="mt-2 max-h-48 overflow-auto text-xs text-ink-soft">
            {JSON.stringify(contextPreview, null, 2)}
          </pre>
        </div>

        {!canGenerate ? (
          <StatusMessage
            className="mt-4"
            tone="info"
            message="Нужны шаблон с тегами, таблица и хотя бы одна связь на экране «Маппинг»."
          />
        ) : null}

        <StatusMessage message={error} className="mt-4" />

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <ShimmerButton
            loading={busy === "docx"}
            disabled={!canGenerate || busy !== null}
            onClick={() => void run("docx")}
            className="w-full sm:w-auto"
          >
            Сгенерировать DOCX
          </ShimmerButton>
          <Button
            variant="secondary"
            loading={busy === "pdf"}
            disabled={!canGenerate || busy !== null}
            onClick={() => void run("pdf")}
            className="w-full sm:w-auto"
          >
            Сгенерировать PDF
          </Button>
          <Link
            href="/app/mapper"
            className="inline-flex min-h-touch w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-muted sm:ml-auto sm:w-auto"
          >
            К маппингу
          </Link>
        </div>

        {download ? (
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-ok/20 bg-ok-soft p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ok">Файл готов: {download.filename}</p>
            <Button
              variant="secondary"
              onClick={() => triggerDownload(download.blob, download.filename)}
            >
              Скачать ещё раз
            </Button>
          </div>
        ) : null}
      </GlassCard>
    </FadeIn>
  );
}
