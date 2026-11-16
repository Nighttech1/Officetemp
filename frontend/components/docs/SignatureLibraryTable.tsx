"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FolderPlus, Search } from "lucide-react";
import {
  createSignFolder,
  deleteSignFolder,
  deleteSignature,
  fileToDataUrl,
  folderPathLabel,
  listSignFoldersIn,
  listSignatureLibrary,
  listSignaturesInFolder,
  upsertSignature,
  type SignatureFolder,
  type SignatureLibEntry,
} from "@/lib/signature-library";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { StatusMessage } from "@/components/StatusMessage";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  projectName?: string;
  onLibraryChange?: () => void;
  refreshKey?: number;
};

export function SignatureLibraryTable({
  projectId,
  projectName,
  onLibraryChange,
  refreshKey = 0,
}: Props) {
  const [tick, setTick] = useState(0);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [surname, setSurname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pendingRow, setPendingRow] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    setFolderId(null);
    setQuery("");
  }, [projectId]);

  useEffect(() => {
    bump();
  }, [refreshKey, bump]);

  // Общая библиотека пришла с сервера на старте → перечитать.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onChanged = () => bump();
    window.addEventListener("docsaas:signatures-changed", onChanged);
    return () =>
      window.removeEventListener("docsaas:signatures-changed", onChanged);
  }, [bump]);

  const childFolders: SignatureFolder[] = useMemo(() => {
    if (!projectId) return [];
    void tick;
    return listSignFoldersIn(projectId, folderId);
  }, [projectId, folderId, tick]);

  const allEntries: SignatureLibEntry[] = useMemo(() => {
    if (!projectId) return [];
    void tick;
    return listSignatureLibrary(projectId);
  }, [projectId, tick]);

  const q = query.trim().toLowerCase().replace(/ё/g, "е");

  const visibleEntries: SignatureLibEntry[] = useMemo(() => {
    if (q) {
      return allEntries
        .filter((e) =>
          e.surname.toLowerCase().replace(/ё/g, "е").includes(q),
        )
        .sort((a, b) => a.surname.localeCompare(b.surname, "ru"));
    }
    return listSignaturesInFolder(projectId, folderId);
  }, [allEntries, q, projectId, folderId]);

  const breadcrumb = useMemo(() => {
    const crumbs: { id: string | null; name: string }[] = [
      { id: null, name: "Все сотрудники" },
    ];
    if (!projectId || !folderId) return crumbs;
    void tick;
    const parts = folderPathLabel(projectId, folderId).split(" / ");
    let parent: string | null = null;
    for (const name of parts) {
      const hit: SignatureFolder | undefined = listSignFoldersIn(
        projectId,
        parent,
      ).find((f) => f.name === name);
      if (!hit) break;
      crumbs.push({ id: hit.id, name: hit.name });
      parent = hit.id;
    }
    return crumbs;
  }, [projectId, folderId, tick]);

  async function saveImage(file: File | undefined, forSurname: string) {
    setError(null);
    setOk(null);
    if (!file) return;
    if (!projectId) {
      setError("Сначала выберите проект");
      return;
    }
    const name = forSurname.trim();
    if (!name) {
      setError("Сначала укажите ФИО / фамилию");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Нужна картинка PNG или JPEG");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      // замена картинки — папку не трогаем; новая запись — в текущую папку
      upsertSignature(projectId, name, dataUrl, {
        folderId: pendingRow ? undefined : folderId,
      });
      setSurname("");
      setOk(`Подпись для «${name}» сохранена`);
      bump();
      onLibraryChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    }
  }

  function onRemove(id: string) {
    deleteSignature(id);
    bump();
    onLibraryChange?.();
  }

  function triggerAdd() {
    setPendingRow(null);
    fileRef.current?.click();
  }

  function triggerReplace(entrySurname: string) {
    setPendingRow(entrySurname);
    fileRef.current?.click();
  }

  function handleNewFolder() {
    if (!projectId) return;
    const name = window.prompt("Название папки", "Отдел");
    if (name === null) return;
    try {
      const f = createSignFolder(projectId, name, folderId);
      bump();
      setFolderId(f.id);
      setOk(`Папка «${f.name}» создана`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать папку");
    }
  }

  function handleDeleteFolder(id: string, name: string) {
    if (!window.confirm(`Удалить папку «${name}» и всё содержимое?`)) return;
    deleteSignFolder(id);
    if (folderId === id) setFolderId(null);
    bump();
    onLibraryChange?.();
  }

  return (
    <GlassCard className="flex flex-col gap-4 p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-ink">Библиотека подписей</h2>
        <p className="mt-1 text-pretty text-sm text-ink-soft">
          Проект: {projectName || "…"}
        </p>
        <p className="mt-2 rounded-lg border border-line bg-surface-muted/40 px-3 py-2 text-pretty text-xs text-ink-muted">
          Подписи нужно добавлять в форматах <strong>PNG</strong> или{" "}
          <strong>JPEG</strong>. Фамилия должна совпадать с фамилией в штампе
          ИУЛ — тогда картинка подставится сама. Раскладывайте сотрудников по
          папкам для удобного поиска.
        </p>
      </div>

      <StatusMessage message={error} tone="error" />
      <StatusMessage message={ok} tone="ok" />

      {/* Поиск — постоянный фильтр */}
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по ФИО…"
          aria-label="Поиск подписей по ФИО"
          className="w-full rounded-lg border border-line bg-surface-muted/30 py-2.5 pl-10 pr-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand/50"
        />
      </label>
      {q ? (
        <p className="text-xs text-ink-muted">
          Найдено: {visibleEntries.length} (по всему проекту)
        </p>
      ) : null}

      {/* Папки */}
      {!q ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <nav
              className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-sm"
              aria-label="Путь папок"
            >
              {breadcrumb.map((c, i) => (
                <span key={`${c.id ?? "root"}-${i}`} className="flex items-center gap-1">
                  {i > 0 ? (
                    <span className="text-ink-muted" aria-hidden>
                      /
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className={cn(
                      "rounded px-1.5 py-0.5 hover:bg-surface-muted",
                      (folderId ?? null) === (c.id ?? null)
                        ? "font-semibold text-ink"
                        : "text-ink-soft",
                    )}
                    onClick={() => setFolderId(c.id)}
                  >
                    {c.name}
                  </button>
                </span>
              ))}
            </nav>
            <Button
              type="button"
              variant="secondary"
              className="!min-h-0 gap-1.5 px-3 py-1.5 text-xs"
              onClick={handleNewFolder}
            >
              <FolderPlus className="h-3.5 w-3.5" aria-hidden />
              Новая папка
            </Button>
          </div>
          {childFolders.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {childFolders.map((f) => (
                <li key={f.id}>
                  <div className="flex items-center gap-0.5 rounded-lg border border-line bg-surface-muted/30">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-sm text-ink hover:text-brand"
                      onClick={() => setFolderId(f.id)}
                    >
                      📁 {f.name}
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1.5 text-xs text-danger hover:bg-danger/10"
                      title="Удалить папку"
                      onClick={() => handleDeleteFolder(f.id, f.name)}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {/* Добавление */}
      <div className="rounded-xl border border-line bg-surface-muted/20 p-3 sm:p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">Добавить подпись</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Field
              label="ФИО / фамилия"
              id="sign-table-surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="например Зеленцов"
            />
          </div>
          <Button type="button" onClick={triggerAdd}>
            Выбрать файл PNG/JPEG
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              void saveImage(f, pendingRow ?? surname);
              setPendingRow(null);
              e.target.value = "";
            }}
          />
        </div>
        {!q && folderId ? (
          <p className="mt-2 text-xs text-ink-muted">
            Новая подпись попадёт в текущую папку.
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto scrollbar-none rounded-xl border border-line">
        <table className="w-full min-w-[20rem] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <th className="px-3 py-2.5">ФИО</th>
              {q ? <th className="px-3 py-2.5">Папка</th> : null}
              <th className="px-3 py-2.5">Подпись</th>
              <th className="w-24 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {visibleEntries.length === 0 ? (
              <tr>
                <td
                  colSpan={q ? 4 : 3}
                  className="px-3 py-8 text-center text-sm text-ink-muted"
                >
                  {q
                    ? "Никого не найдено — измените запрос."
                    : "Пока пусто — добавьте подпись выше или создайте папку."}
                </td>
              </tr>
            ) : (
              visibleEntries.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="px-3 py-3 font-medium text-ink">{e.surname}</td>
                  {q ? (
                    <td className="px-3 py-3 text-xs text-ink-muted">
                      {folderPathLabel(projectId, e.folderId ?? null)}
                    </td>
                  ) : null}
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className="rounded-lg border border-dashed border-line bg-white p-2 hover:border-brand/40"
                      onClick={() => triggerReplace(e.surname)}
                      title="Заменить картинку"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={e.imageDataUrl}
                        alt={`Подпись ${e.surname}`}
                        className="h-12 max-w-[10rem] object-contain"
                      />
                    </button>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      className="!min-h-0 px-2 py-1 text-xs text-danger"
                      onClick={() => onRemove(e.id)}
                    >
                      Удалить
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
