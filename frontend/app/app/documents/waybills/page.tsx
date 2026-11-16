"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import { ProjectSidebar } from "@/components/docs/ProjectSidebar";
import { WaybillWizard } from "@/components/docs/WaybillWizard";
import { WaybillRegistrySettingsPanel } from "@/components/docs/WaybillRegistrySettingsPanel";
import { DocsContourBar } from "@/components/docs/DocsContourBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { FadeIn } from "@/components/ui/FadeIn";
import { Button } from "@/components/Button";
import {
  createDocument,
  ensureDemoWorkspace,
  getDocument,
  getProject,
  listDocuments,
  listProjects,
} from "@/lib/docs-store";
import { loadDocsTreeUi, saveDocsTreeUi } from "@/lib/docs-tree-ui";

function ensureWaybillDoc(projectId: string): string {
  const existing = listDocuments(projectId).filter((d) => d.kind === "waybill");
  if (existing.length > 0) return existing[0].id;
  return createDocument(projectId, "waybill", "Новая накладная", null).id;
}

/** Выбрать живой projectId + waybill docId после sync/инициализации. */
function resolveWaybillSelection(): {
  projectId: string;
  folderId: string | null;
  docId: string;
} {
  const demo = ensureDemoWorkspace("waybill");
  let openId: string | null = null;
  try {
    openId = sessionStorage.getItem("docsaas_open_waybill");
    if (openId) sessionStorage.removeItem("docsaas_open_waybill");
  } catch {
    openId = null;
  }
  const ui = loadDocsTreeUi();
  const openDoc = openId ? getDocument(openId) : null;
  const savedProject =
    ui.projectId && getProject(ui.projectId) ? ui.projectId : null;
  const projects = listProjects("waybill");
  const pid =
    openDoc?.projectId ??
    savedProject ??
    (projects[0]?.id || demo.projectId);
  const savedWb =
    ui.lastWaybillDocId &&
    getDocument(ui.lastWaybillDocId)?.kind === "waybill"
      ? ui.lastWaybillDocId
      : null;
  const nextDocId =
    openDoc?.kind === "waybill"
      ? openDoc.id
      : savedWb && getDocument(savedWb)?.projectId === pid
        ? savedWb
        : ensureWaybillDoc(pid);
  const fid =
    openDoc?.folderId ??
    (ui.folderId && (openDoc || savedProject) ? ui.folderId : null);
  saveDocsTreeUi({
    projectId: pid,
    folderId: fid,
    lastWaybillDocId: nextDocId,
  });
  return { projectId: pid, folderId: fid, docId: nextDocId };
}

export default function WaybillsPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [selectedIulIds, setSelectedIulIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [registrySettingsOpen, setRegistrySettingsOpen] = useState(false);

  const rebind = useCallback(() => {
    const next = resolveWaybillSelection();
    setProjectId(next.projectId);
    setFolderId(next.folderId);
    setDocId(next.docId);
    setSelectedIulIds([]);
    setRefreshKey((k) => k + 1);
    setReady(true);
  }, []);

  useEffect(() => {
    rebind();
  }, [rebind]);

  // После pull workspace — перепривязать docId (иначе вкладки/сохранение «мёртвые»).
  useEffect(() => {
    function onWorkspaceChanged() {
      rebind();
    }
    window.addEventListener(
      "docsaas:workspace-changed",
      onWorkspaceChanged as EventListener,
    );
    return () =>
      window.removeEventListener(
        "docsaas:workspace-changed",
        onWorkspaceChanged as EventListener,
      );
  }, [rebind]);

  useEffect(() => {
    if (!ready || !projectId) return;
    if (docId) {
      const d = getDocument(docId);
      if (d?.projectId === projectId && d.kind === "waybill") {
        saveDocsTreeUi({
          projectId,
          folderId,
          lastWaybillDocId: docId,
        });
        return;
      }
    }
    const id = ensureWaybillDoc(projectId);
    setDocId(id);
    saveDocsTreeUi({ projectId, folderId, lastWaybillDocId: id });
  }, [ready, projectId, docId, folderId]);

  const handleMultiDocChange = useCallback((ids: string[]) => {
    const iuls = ids.filter((id) => getDocument(id)?.kind === "info_sheet");
    const waybills = ids.filter((id) => getDocument(id)?.kind === "waybill");
    setSelectedIulIds(iuls);
    if (waybills.length === 1) setDocId(waybills[0]);
  }, []);

  const iulIdsLive = useMemo(() => {
    void refreshKey;
    return selectedIulIds.filter(
      (id) => getDocument(id)?.kind === "info_sheet",
    );
  }, [selectedIulIds, refreshKey]);

  const liveDoc =
    docId && getDocument(docId)?.kind === "waybill" ? getDocument(docId) : null;

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col sm:min-h-[calc(100dvh-8rem)] sm:flex-row sm:items-stretch">
      <ProjectSidebar
        kind="waybill"
        selectedProjectId={projectId}
        selectedFolderId={folderId}
        selectedDocId={docId}
        signaturesOpen={false}
        onSelectProject={(id) => {
          if (id !== projectId) {
            setDocId(null);
            setSelectedIulIds([]);
          }
          setProjectId(id);
          setFolderId(null);
          saveDocsTreeUi({ projectId: id, folderId: null });
        }}
        onSelectFolder={(id) => {
          setFolderId(id);
          saveDocsTreeUi({ projectId, folderId: id });
        }}
        onSelectDoc={(id) => {
          const d = id ? getDocument(id) : null;
          if (!d) return;
          if (d.kind === "info_sheet") {
            saveDocsTreeUi({
              projectId: d.projectId,
              folderId: d.folderId ?? null,
              lastIulDocId: id,
            });
            return;
          }
          setDocId(id);
          saveDocsTreeUi({
            projectId: d.projectId,
            folderId: d.folderId ?? null,
            lastWaybillDocId: id,
          });
        }}
        onMultiDocChange={handleMultiDocChange}
        onSelectSignatures={() => undefined}
        refreshKey={refreshKey}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pt-4 pb-4 sm:px-5 sm:pt-5 sm:pb-5 lg:px-6">
        <FadeIn className="flex min-h-0 flex-1 flex-col">
          <DocsContourBar
            product="waybill"
            title="Накладные"
            className="shrink-0"
            actions={
              <Button
                type="button"
                variant="secondary"
                disabled={!projectId}
                onClick={() => projectId && setRegistrySettingsOpen(true)}
                className="inline-flex items-center gap-1.5 !text-ink"
              >
                <Settings2 size={16} aria-hidden />
                Настройки реестра
              </Button>
            }
          />
          <div className="mb-3 shrink-0">
            <p className="text-pretty text-sm text-ink-muted">
              Сначала слева создайте или выберите проект. Затем откройте/создайте
              накладную и загрузите шаблон. После «Сформировать DOCX/PDF» в
              дереве появится файл с номером — по клику поля мастера
              восстановятся. ИУЛ (Ctrl/Shift) подставляются на шаге «Данные».
              {iulIdsLive.length ? ` Выбрано ИУЛ: ${iulIdsLive.length}.` : ""}
            </p>
          </div>

          {!ready ? (
            <GlassCard className="p-6">
              <p className="text-sm text-ink-soft">Загрузка…</p>
            </GlassCard>
          ) : !projectId ? (
            <GlassCard className="p-6">
              <p className="text-pretty text-sm text-ink-soft">
                Слева нажмите «+» и создайте проект — без проекта шаблон
                загрузить нельзя.
              </p>
            </GlassCard>
          ) : liveDoc && docId ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <WaybillWizard
                key={`${docId}:${refreshKey}`}
                docId={docId}
                selectedIulIds={iulIdsLive}
                onChanged={() => setRefreshKey((k) => k + 1)}
                onOpenDoc={(id) => {
                  setDocId(id);
                  const d = getDocument(id);
                  if (d) {
                    setProjectId(d.projectId);
                    setFolderId(d.folderId);
                    saveDocsTreeUi({
                      projectId: d.projectId,
                      folderId: d.folderId,
                      lastWaybillDocId: id,
                    });
                  }
                  setRefreshKey((k) => k + 1);
                }}
              />
            </div>
          ) : (
            <GlassCard className="p-6">
              <p className="text-pretty text-sm text-ink-soft">
                В проекте слева создайте накладную (кнопка документа) — затем
                можно загружать шаблон Word.
              </p>
              <Button
                type="button"
                className="mt-3"
                onClick={() => {
                  if (!projectId) return;
                  const id = ensureWaybillDoc(projectId);
                  setDocId(id);
                  saveDocsTreeUi({
                    projectId,
                    folderId,
                    lastWaybillDocId: id,
                  });
                  setRefreshKey((k) => k + 1);
                }}
              >
                Создать накладную
              </Button>
            </GlassCard>
          )}
        </FadeIn>
        {projectId ? (
          <WaybillRegistrySettingsPanel
            projectId={projectId}
            open={registrySettingsOpen}
            onClose={() => setRegistrySettingsOpen(false)}
          />
        ) : null}
      </div>
    </div>
  );
}
