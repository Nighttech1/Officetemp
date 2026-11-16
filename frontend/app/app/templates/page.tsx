"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ApiError,
  analyzeTemplate,
  createTemplate,
  listTemplates,
  type TemplateOut,
} from "@/lib/api";
import {
  getTemplateTags,
  saveTemplateFile,
  saveTemplateTags,
} from "@/lib/workspace";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { StatusMessage } from "@/components/StatusMessage";
import { FadeIn } from "@/components/ui/FadeIn";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShimmerButton } from "@/components/ui/ShimmerButton";

function makeStorageKey(filename: string): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const safe = filename.replace(/[^\w.\-а-яА-ЯёЁ]+/g, "_");
  return `local/${id}/${safe}`;
}

export default function TemplatesPage() {
  const [items, setItems] = useState<TemplateOut[]>([]);
  const [tagsById, setTagsById] = useState<Record<string, string[]>>({});
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewTags, setPreviewTags] = useState<string[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setListError(null);
    setLoadingList(true);
    try {
      const data = await listTemplates();
      setItems(data);
      const map: Record<string, string[]> = {};
      for (const t of data) {
        map[t.id] = getTemplateTags(t.id);
      }
      setTagsById(map);
    } catch (err) {
      setListError(
        err instanceof ApiError ? err.detail : "Не удалось загрузить список",
      );
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onAnalyzeAndSave(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormOk(null);
    if (!file) {
      setFormError("Выберите файл Word (.docx)");
      return;
    }
    if (!name.trim()) {
      setFormError("Укажите понятное название шаблона");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setFormError("Нужен файл с расширением .docx");
      return;
    }

    setAnalyzing(true);
    let tags: string[] = [];
    try {
      const analyzed = await analyzeTemplate(file);
      tags = analyzed.tags ?? [];
      setPreviewTags(tags);
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? `Анализ не удался: ${err.detail}`
          : "Не удалось проанализировать шаблон",
      );
      setAnalyzing(false);
      return;
    }
    setAnalyzing(false);

    setSaving(true);
    try {
      const storage_key = makeStorageKey(file.name);
      const created = await createTemplate({
        name: name.trim(),
        storage_key,
      });
      saveTemplateTags(created.id, tags);
      await saveTemplateFile(file);
      setFormOk(
        tags.length
          ? `Шаблон «${created.name}» сохранён. Найдено тегов: ${tags.length}.`
          : `Шаблон «${created.name}» сохранён. Теги в файле не найдены.`,
      );
      setName("");
      setFile(null);
      setPreviewTags(tags);
      await refresh();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.detail : "Не удалось сохранить шаблон",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <FadeIn className="flex flex-col gap-6">
      <div>
        <h1 className="text-balance text-2xl font-semibold text-ink">Шаблоны</h1>
        <p className="mt-1 text-pretty text-sm text-ink-muted">
          Загрузите Word-файл с полями {"{{ ИмяТега }}"}. Система найдёт теги и
          добавит шаблон в библиотеку.
        </p>
      </div>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink">Новый шаблон</h2>
        <form className="mt-4 flex flex-col gap-4" onSubmit={onAnalyzeAndSave}>
          <Field
            label="Название"
            name="template_name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Договор с клиентом"
          />
          <label className="flex w-full flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Файл Word (.docx)</span>
            <input
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="block w-full min-h-touch text-sm text-ink file:mr-3 file:min-h-touch file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-muted file:px-3 file:py-2 file:font-semibold file:text-brand-ink"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setPreviewTags([]);
                setFormOk(null);
                setFormError(null);
              }}
            />
          </label>
          <StatusMessage message={formError} />
          <StatusMessage message={formOk} tone="ok" />
          {previewTags.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-ink">Найденные теги</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {previewTags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-md bg-surface-muted px-2.5 py-1 font-mono text-xs text-ink-soft"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <ShimmerButton
            type="submit"
            loading={analyzing || saving}
            className="w-full sm:w-auto"
          >
            Проанализировать и сохранить
          </ShimmerButton>
        </form>
      </GlassCard>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">Библиотека</h2>
          <Button variant="ghost" onClick={() => void refresh()} disabled={loadingList}>
            Обновить
          </Button>
        </div>
        <StatusMessage message={listError} className="mt-3" />
        {loadingList ? (
          <p className="mt-3 text-sm text-ink-muted">Загружаем список…</p>
        ) : null}
        {!loadingList && items.length === 0 ? (
          <p className="mt-3 text-pretty text-sm text-ink-muted">
            Пока нет шаблонов. Загрузите первый файл выше.
          </p>
        ) : null}
        <ul className="mt-3 flex flex-col gap-3">
          {items.map((t) => {
            const tags = tagsById[t.id] ?? [];
            return (
              <li key={t.id}>
                <GlassCard className="p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">{t.name}</p>
                      <p className="mt-0.5 break-all text-xs text-ink-muted">
                        {t.storage_key}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted tabular-nums">
                        {new Date(t.created_at).toLocaleString("ru-RU")}
                      </p>
                    </div>
                  </div>
                  {tags.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded bg-brand-muted px-2 py-0.5 font-mono text-xs text-brand-ink"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-ink-muted">
                      Теги сохранены на этом устройстве после загрузки. Если список
                      пуст — загрузите шаблон ещё раз.
                    </p>
                  )}
                </GlassCard>
              </li>
            );
          })}
        </ul>
      </section>
    </FadeIn>
  );
}
