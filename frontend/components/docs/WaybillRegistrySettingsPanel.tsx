"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { StatusMessage } from "@/components/StatusMessage";
import {
  createWaybillRegistryProfile,
  deleteWaybillRegistryProfile,
  getActiveWaybillRegistryProfile,
  listWaybillRegistryProfiles,
  setActiveWaybillRegistryProfile,
  updateWaybillRegistryProfile,
  type WaybillRegistryProfile,
} from "@/lib/docs-store";
import { cn } from "@/lib/utils";
import {
  registryMapToRows,
  rowsToRegistryMap,
  WaybillRegistryFieldList,
  type RegistryFieldRow,
} from "@/components/docs/WaybillRegistryFieldList";

type Props = {
  projectId: string;
  open: boolean;
  onClose: () => void;
};

export function WaybillRegistrySettingsPanel({
  projectId,
  open,
  onClose,
}: Props) {
  const [profiles, setProfiles] = useState<WaybillRegistryProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [registryUrl, setRegistryUrl] = useState("");
  const [rows, setRows] = useState<RegistryFieldRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(() => {
    setProfiles(listWaybillRegistryProfiles(projectId));
    const active = getActiveWaybillRegistryProfile(projectId);
    setActiveId(active?.id ?? null);
  }, [projectId]);

  useEffect(() => {
    if (!open) return;
    reload();
    setEditingId(null);
    setMsg(null);
    setErr(null);
  }, [open, reload]);

  function loadEditor(p: WaybillRegistryProfile) {
    setEditingId(p.id);
    setName(p.name);
    setRegistryUrl(p.registryUrl);
    setRows(registryMapToRows(p.registryMap));
    setMsg(null);
    setErr(null);
  }

  function startNew() {
    const created = createWaybillRegistryProfile(projectId, {
      name: `Профиль ${profiles.length + 1}`,
    });
    if (created) {
      reload();
      loadEditor(created);
    }
  }

  function saveEditor() {
    if (!editingId) return;
    const updated = updateWaybillRegistryProfile(projectId, editingId, {
      name,
      registryUrl,
      registryMap: rowsToRegistryMap(rows),
    });
    if (updated) {
      reload();
      setMsg("Профиль сохранён.");
      setErr(null);
    }
  }

  function removeProfile(id: string) {
    if (!deleteWaybillRegistryProfile(projectId, id)) return;
    reload();
    if (editingId === id) setEditingId(null);
  }

  function makeActive(id: string) {
    setActiveWaybillRegistryProfile(projectId, id);
    reload();
    setMsg("Этот профиль назначен текущим — новые накладные подставят его в шаг «Реестр».");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="waybill-registry-settings-title"
    >
      <div className="flex max-h-[min(92dvh,820px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface-card shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h2
            id="waybill-registry-settings-title"
            className="text-lg font-semibold text-ink"
          >
            Настройки реестра
          </h2>
          <Button type="button" variant="ghost" className="!min-w-0 px-2" onClick={onClose}>
            <X size={18} aria-hidden />
            <span className="sr-only">Закрыть</span>
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 sm:grid-cols-[minmax(0,11rem)_1fr] sm:p-5">
          <div className="flex min-h-0 flex-col gap-2">
            <p className="text-sm font-medium text-ink">Профили</p>
            <div className="scrollbar-brand flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {profiles.map((p) => {
                const isActive = p.id === activeId;
                const isEditing = p.id === editingId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => loadEditor(p)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                      isActive
                        ? "border-brand bg-brand/10 ring-1 ring-brand"
                        : "border-line bg-surface-muted/30 hover:border-brand/40",
                      isEditing && "shadow-sm",
                    )}
                  >
                    <span className="font-semibold text-ink">{p.name}</span>
                    {isActive ? (
                      <span className="mt-0.5 block text-xs text-brand">Текущий</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <Button type="button" variant="secondary" className="shrink-0 text-xs" onClick={startNew}>
              + Новый профиль
            </Button>
          </div>

          <div className="scrollbar-brand min-h-0 overflow-y-auto pr-1">
            {editingId ? (
              <div className="flex flex-col gap-4">
                <StatusMessage message={err} tone="error" />
                <StatusMessage message={msg} tone="ok" />
                <Field
                  label="Название профиля"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Field
                  label="Ссылка на реестр"
                  value={registryUrl}
                  onChange={(e) => setRegistryUrl(e.target.value)}
                  placeholder="https://…"
                />
                <div>
                  <span className="text-sm font-medium text-ink">Соответствие полей</span>
                  <WaybillRegistryFieldList rows={rows} onChange={setRows} className="mt-2" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={saveEditor}>
                    Сохранить профиль
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => makeActive(editingId)}>
                    Сделать текущим
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-danger"
                    onClick={() => removeProfile(editingId)}
                  >
                    Удалить
                  </Button>
                </div>
                <p className="text-pretty text-xs text-ink-muted">
                  Текущий профиль автоматически подставляется в шаг «Реестр» при создании новой
                  накладной. В уже открытой накладной поля можно изменить вручную.
                </p>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">
                Выберите профиль слева или создайте новый. Заполните ссылку и соответствие колонок
                один раз — дальше они подставятся сами.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
