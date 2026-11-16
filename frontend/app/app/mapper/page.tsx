"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  analyzeTemplate,
  listTemplates,
  uploadExcel,
  type TemplateOut,
} from "@/lib/api";
import {
  getTemplateTags,
  loadWorkspace,
  saveTemplateFile,
  saveWorkspace,
  type WorkspaceState,
} from "@/lib/workspace";
import { StatusMessage } from "@/components/StatusMessage";
import { FadeIn } from "@/components/ui/FadeIn";
import { GlassCard } from "@/components/ui/GlassCard";

export default function MapperPage() {
  const [ws, setWs] = useState<WorkspaceState | null>(null);
  const [templates, setTemplates] = useState<TemplateOut[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [dataBusy, setDataBusy] = useState(false);
  const [tplBusy, setTplBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    setWs(loadWorkspace());
    void (async () => {
      try {
        setTemplates(await listTemplates());
      } catch {
        // library optional for upload path
      }
    })();
  }, []);

  function persist(next: WorkspaceState) {
    setWs(next);
    saveWorkspace(next);
  }

  async function onExcel(file: File | undefined) {
    if (!file || !ws) return;
    setError(null);
    setOk(null);
    setDataBusy(true);
    try {
      const ds = await uploadExcel(file);
      const mapping: Record<string, string> = { ...ws.mapping };
      for (const tag of ws.tags) {
        if (!(tag in mapping)) mapping[tag] = "";
      }
      persist({
        ...ws,
        columns: ds.columns,
        rows: ds.rows,
        dataFilename: file.name,
        mapping,
      });
      setOk(
        `Таблица загружена: ${ds.meta.row_count} строк, ${ds.columns.length} колонок.`,
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : "Не удалось прочитать Excel/CSV",
      );
    } finally {
      setDataBusy(false);
    }
  }

  async function onTemplateFile(file: File | undefined) {
    if (!file || !ws) return;
    setError(null);
    setOk(null);
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setError("Нужен файл .docx");
      return;
    }
    setTplBusy(true);
    try {
      const { tags } = await analyzeTemplate(file);
      await saveTemplateFile(file);
      const mapping: Record<string, string> = {};
      for (const tag of tags) {
        mapping[tag] = ws.mapping[tag] ?? "";
      }
      persist({
        ...ws,
        templateName: file.name,
        templateId: null,
        tags,
        mapping,
      });
      setSelectedId("");
      setOk(
        tags.length
          ? `Шаблон принят. Тегов: ${tags.length}.`
          : "Шаблон принят, но теги не найдены.",
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Не удалось разобрать шаблон",
      );
    } finally {
      setTplBusy(false);
    }
  }

  async function onSelectLibrary(id: string) {
    if (!ws) return;
    setSelectedId(id);
    setError(null);
    setOk(null);
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    const tags = getTemplateTags(id);
    if (!tags.length) {
      setError(
        "Для этого шаблона нет сохранённых тегов на устройстве. Загрузите .docx заново ниже — так файл понадобится и для генерации.",
      );
      return;
    }
    const mapping: Record<string, string> = {};
    for (const tag of tags) {
      mapping[tag] = ws.mapping[tag] ?? "";
    }
    persist({
      ...ws,
      templateId: id,
      templateName: tpl.name,
      tags,
      mapping,
    });
    setOk(
      `Выбран «${tpl.name}». Загрузите тот же .docx ниже, чтобы генерация могла заполнить документ (S3 в MVP не подключён).`,
    );
  }

  function setMapping(tag: string, column: string) {
    if (!ws) return;
    persist({
      ...ws,
      mapping: { ...ws.mapping, [tag]: column },
    });
  }

  if (!ws) {
    return <p className="text-sm text-ink-muted">Загрузка…</p>;
  }

  const mappedCount = Object.values(ws.mapping).filter(Boolean).length;
  const selectClass =
    "min-h-touch w-full rounded-xl border border-line bg-surface-muted/80 px-3 text-base text-ink";

  return (
    <FadeIn className="flex flex-col gap-6">
      <div>
        <h1 className="text-balance text-2xl font-semibold text-ink">Маппинг</h1>
        <p className="mt-1 text-pretty text-sm text-ink-muted">
          Свяжите колонки таблицы с полями шаблона. Настройки сохраняются в этом
          браузере до закрытия вкладки.
        </p>
      </div>

      <StatusMessage message={error} />
      <StatusMessage message={ok} tone="ok" />

      <section className="grid gap-4 md:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="text-base font-semibold text-ink">1. Таблица</h2>
          <p className="mt-1 text-pretty text-sm text-ink-muted">
            Excel (.xlsx) или CSV
          </p>
          <input
            type="file"
            accept=".xlsx,.xlsm,.csv"
            disabled={dataBusy}
            className="mt-4 block w-full min-h-touch text-sm file:mr-3 file:min-h-touch file:rounded-lg file:border-0 file:bg-brand-muted file:px-3 file:py-2 file:font-semibold file:text-brand-ink"
            onChange={(e) => void onExcel(e.target.files?.[0])}
          />
          {dataBusy ? (
            <p className="mt-2 text-sm text-ink-muted">Читаем файл…</p>
          ) : null}
          {ws.dataFilename ? (
            <p className="mt-3 text-sm text-ink-soft">
              Файл: <strong>{ws.dataFilename}</strong>
              {ws.columns.length ? (
                <>
                  {" "}
                  · колонок: {ws.columns.length} · строк: {ws.rows.length}
                </>
              ) : null}
            </p>
          ) : null}
          {ws.columns.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {ws.columns.map((c) => (
                <li
                  key={c}
                  className="rounded bg-surface-muted px-2 py-0.5 text-xs text-ink-soft"
                >
                  {c}
                </li>
              ))}
            </ul>
          ) : null}
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-base font-semibold text-ink">2. Шаблон</h2>
          <p className="mt-1 text-pretty text-sm text-ink-muted">
            Из библиотеки или новый .docx
          </p>
          {templates.length > 0 ? (
            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Из библиотеки</span>
              <select
                className={selectClass}
                value={selectedId}
                onChange={(e) => void onSelectLibrary(e.target.value)}
              >
                <option value="">— выберите —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Файл .docx</span>
            <input
              type="file"
              accept=".docx"
              disabled={tplBusy}
              className="block w-full min-h-touch text-sm file:mr-3 file:min-h-touch file:rounded-lg file:border-0 file:bg-brand-muted file:px-3 file:py-2 file:font-semibold file:text-brand-ink"
              onChange={(e) => void onTemplateFile(e.target.files?.[0])}
            />
          </label>
          {tplBusy ? (
            <p className="mt-2 text-sm text-ink-muted">Анализируем шаблон…</p>
          ) : null}
          {ws.templateName ? (
            <p className="mt-3 text-sm text-ink-soft">
              Шаблон: <strong>{ws.templateName}</strong>
              {ws.tags.length ? <> · тегов: {ws.tags.length}</> : null}
            </p>
          ) : null}
        </GlassCard>
      </section>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink">3. Связи колонка → тег</h2>
        <p className="mt-1 text-pretty text-sm text-ink-muted">
          Для каждого поля шаблона выберите колонку из таблицы. Связано:{" "}
          {mappedCount} из {ws.tags.length || "—"}.
        </p>

        {ws.tags.length === 0 || ws.columns.length === 0 ? (
          <p className="mt-4 text-pretty text-sm text-ink-muted">
            Сначала загрузите и таблицу, и шаблон — тогда появятся выпадающие
            списки.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {ws.tags.map((tag) => (
              <li
                key={tag}
                className="flex flex-col gap-2 rounded-xl border border-line bg-surface/60 p-3 sm:flex-row sm:items-center"
              >
                <span className="min-w-0 flex-1 break-all font-mono text-sm text-ink">
                  {tag}
                </span>
                <label className="flex w-full flex-col gap-1 sm:w-64">
                  <span className="sr-only">Колонка для {tag}</span>
                  <select
                    className={`${selectClass} text-sm`}
                    value={ws.mapping[tag] ?? ""}
                    onChange={(e) => setMapping(tag, e.target.value)}
                  >
                    <option value="">— не выбрано —</option>
                    {ws.columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5">
          <Link
            href="/app/generate"
            className="shimmer-btn relative inline-flex min-h-touch w-full items-center justify-center overflow-hidden rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-brand-hover sm:w-auto"
          >
            <span className="relative z-10">Перейти к генерации</span>
          </Link>
        </div>
      </GlassCard>
    </FadeIn>
  );
}
