"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteSignature,
  fileToDataUrl,
  listSignatureLibrary,
  upsertSignature,
  type SignatureLibEntry,
} from "@/lib/signature-library";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { StatusMessage } from "@/components/StatusMessage";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  onLibraryChange?: () => void;
  /** Смена ключа → перечитать localStorage. */
  refreshKey?: number;
  /** Компактный вид для сайдбара. */
  compact?: boolean;
  className?: string;
};

export function SignatureLibraryPanel({
  projectId,
  onLibraryChange,
  refreshKey = 0,
  compact = false,
  className,
}: Props) {
  const [entries, setEntries] = useState<SignatureLibEntry[]>([]);
  const [surname, setSurname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const reload = useCallback(() => {
    setEntries(projectId ? listSignatureLibrary(projectId) : []);
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload, refreshKey]);

  async function onAdd(file: File | undefined) {
    setError(null);
    setOk(null);
    if (!file) return;
    if (!projectId) {
      setError("Сначала выберите проект");
      return;
    }
    if (!surname.trim()) {
      setError("Сначала укажите фамилию");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Нужна картинка PNG или JPG");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      const name = surname.trim();
      upsertSignature(projectId, name, dataUrl);
      setSurname("");
      setOk(`Подпись для «${name}» сохранена`);
      reload();
      onLibraryChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    }
  }

  function onRemove(id: string) {
    deleteSignature(id);
    reload();
    onLibraryChange?.();
  }

  if (!projectId) {
    return (
      <p className={cn("px-2 py-2 text-xs", compact ? "text-white/45" : "text-ink-muted")}>
        Выберите проект, чтобы управлять подписями.
      </p>
    );
  }

  return (
    <div
      className={cn(
        compact
          ? "flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-2"
          : "flex flex-col gap-3 rounded-xl border border-line bg-surface-muted/30 p-3",
        className,
      )}
    >
      {!compact ? (
        <div>
          <h3 className="text-sm font-semibold text-ink">Библиотека подписей</h3>
          <p className="mt-0.5 text-pretty text-xs text-ink-soft">
            Загрузите картинку подписи для фамилии. В ИУЛ картинка подставится
            сама, когда фамилия совпадёт.
          </p>
        </div>
      ) : null}
      <StatusMessage message={error} tone="error" />
      <StatusMessage message={ok} tone="ok" />
      {compact ? (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-white/60">Фамилия</span>
          <input
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            placeholder="например Зеленцов"
            className="w-full rounded-md border border-white/15 bg-white/10 px-2 py-1.5 text-xs text-white outline-none placeholder:text-white/35 focus:border-white/30"
          />
        </label>
      ) : (
        <Field
          label="Фамилия"
          id={`sign-lib-surname-${projectId}`}
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
          placeholder="например Зеленцов"
        />
      )}
      <label
        className={cn(
          "flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed px-3 py-3 text-center text-xs",
          compact
            ? "border-white/20 text-white/55 hover:border-white/40"
            : "border-line text-ink-muted hover:border-brand/40",
        )}
      >
        <span>Картинка подписи (PNG/JPG)</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg"
          className="sr-only"
          onChange={(e) => {
            void onAdd(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {entries.length === 0 ? (
        <p
          className={cn(
            "text-xs",
            compact ? "text-white/40" : "text-ink-muted",
          )}
        >
          Пока пусто — добавьте первую подпись.
        </p>
      ) : (
        <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
          {entries.map((e) => (
            <li
              key={e.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2 py-1.5",
                compact
                  ? "border-white/10 bg-white/5"
                  : "border-line bg-surface-card",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={e.imageDataUrl}
                alt={`Подпись ${e.surname}`}
                className="h-8 w-16 object-contain bg-white"
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm font-medium",
                  compact ? "text-white/90" : "text-ink",
                )}
              >
                {e.surname}
              </span>
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  "!min-h-0 px-2 py-1 text-xs",
                  compact && "text-white/60 hover:text-white",
                )}
                onClick={() => onRemove(e.id)}
              >
                ×
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
