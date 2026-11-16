"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2 } from "lucide-react";
import { ProjectSidebar } from "@/components/docs/ProjectSidebar";
import { InfoSheetWizard } from "@/components/docs/InfoSheetWizard";
import { SignatureLibraryTable } from "@/components/docs/SignatureLibraryTable";
import { DocsContourBar } from "@/components/docs/DocsContourBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { FadeIn } from "@/components/ui/FadeIn";
import {
  createDocument,
  ensureDemoWorkspace,
  getDocument,
  getProject,
  listDocuments,
  projectDefaultHashAlgo,
} from "@/lib/docs-store";
import { loadDocsTreeUi, saveDocsTreeUi } from "@/lib/docs-tree-ui";
import { seedIulFromPdf } from "@/lib/iul-seed";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";

/** Черновик ИУЛ в проекте — чтобы мастер всегда был на экране. */
function ensureDraftDoc(projectId: string): string {
  const existing = listDocuments(projectId).filter(
    (d) => d.kind === "info_sheet",
  );
  if (existing.length > 0) return existing[0].id;
  return createDocument(
    projectId,
    "info_sheet",
    "ИУЛ — черновик",
    null,
  ).id;
}

export default function InfoSheetPage() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [batchDocIds, setBatchDocIds] = useState<string[]>([]);
  const [multiDocIds, setMultiDocIds] = useState<string[]>([]);
  const [signaturesOpen, setSignaturesOpen] = useState(false);
  const [roleSettingsOpen, setRoleSettingsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchMsg, setBatchMsg] = useState<string | null>(null);

  useEffect(() => {
    const demo = ensureDemoWorkspace("info_sheet");
    const ui = loadDocsTreeUi();
    const savedProject =
      ui.projectId && getProject(ui.projectId) ? ui.projectId : null;
    const pid = savedProject ?? demo.projectId;
    const savedDoc =
      ui.lastIulDocId && getDocument(ui.lastIulDocId)?.kind === "info_sheet"
        ? ui.lastIulDocId
        : null;
    const fid =
      ui.folderId && savedProject ? ui.folderId : null;
    setProjectId(pid);
    setFolderId(fid);
    setDocId(savedDoc ?? demo.docId);
    setBatchDocIds([]);
    setMultiDocIds([]);
    setSignaturesOpen(false);
    setRefreshKey((k) => k + 1);
    setReady(true);
    saveDocsTreeUi({ projectId: pid, folderId: fid });
  }, []);

  // Мастер всегда открыт: при смене проекта без документа — черновик
  useEffect(() => {
    if (!ready || !projectId || signaturesOpen) return;
    if (docId) {
      const d = getDocument(docId);
      if (d?.projectId === projectId && d.kind === "info_sheet") {
        saveDocsTreeUi({
          projectId,
          folderId,
          lastIulDocId: docId,
        });
        return;
      }
      if (d?.kind === "waybill") {
        // Выбрана накладная в общем дереве — не открываем мастер ИУЛ
        return;
      }
    }
    const id = ensureDraftDoc(projectId);
    setDocId(id);
    setBatchDocIds([]);
    saveDocsTreeUi({ projectId, folderId, lastIulDocId: id });
  }, [ready, projectId, signaturesOpen, docId]);

  const doc = docId && !signaturesOpen ? getDocument(docId) : null;
  const projectName = projectId ? getProject(projectId)?.name : undefined;

  async function handleBatchCreate(payload: {
    projectId: string;
    folderId: string | null;
    files: File[];
  }) {
    setBatchBusy(true);
    setBatchMsg(null);
    setSignaturesOpen(false);
    try {
      const algo = projectDefaultHashAlgo(payload.projectId);
      const createdIds: string[] = [];
      for (const file of payload.files) {
        const stem = file.name.replace(/\.pdf$/i, "");
        const docItem = createDocument(
          payload.projectId,
          "info_sheet",
          `ИУЛ — ${stem}`.slice(0, 200),
          payload.folderId,
        );
        await seedIulFromPdf(docItem.id, file, { hashAlgo: algo });
        createdIds.push(docItem.id);
      }
      setProjectId(payload.projectId);
      setFolderId(payload.folderId);
      setBatchDocIds(createdIds);
      setMultiDocIds(createdIds);
      setDocId(createdIds[0] ?? null);
      setRefreshKey((k) => k + 1);
      setBatchMsg(
        `Создано ИУЛов: ${createdIds.length} (хэш ${algo}). Переключайте вкладки слева в мастере.`,
      );
    } catch (e) {
      setBatchMsg(
        e instanceof Error ? e.message : "Не удалось создать пакет ИУЛ",
      );
    } finally {
      setBatchBusy(false);
    }
  }


  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col sm:min-h-[calc(100dvh-8rem)] sm:flex-row sm:items-stretch">
      <ProjectSidebar
        kind="info_sheet"
        selectedProjectId={projectId}
        selectedFolderId={folderId}
        selectedDocId={signaturesOpen ? null : docId}
        signaturesOpen={signaturesOpen}
        onSelectProject={(id) => {
          if (id !== projectId) {
            setBatchDocIds([]);
            setMultiDocIds([]);
            setDocId(null);
          }
          setProjectId(id);
          setFolderId(null);
          setSignaturesOpen(false);
          saveDocsTreeUi({ projectId: id, folderId: null });
        }}
        onSelectFolder={(id) => {
          setFolderId(id);
          setSignaturesOpen(false);
          setBatchDocIds([]);
          saveDocsTreeUi({ projectId: projectId, folderId: id });
        }}
        onSelectDoc={(id) => {
          const d = id ? getDocument(id) : null;
          if (d?.kind === "waybill") {
            try {
              sessionStorage.setItem("docsaas_open_waybill", id!);
            } catch {
              /* ignore */
            }
            saveDocsTreeUi({
              projectId: d.projectId,
              folderId: d.folderId ?? null,
              lastWaybillDocId: id,
            });
            router.push("/app/documents/waybills");
            return;
          }
          setDocId(id);
          setSignaturesOpen(false);
          setBatchDocIds((prev) =>
            id && prev.includes(id) ? prev : id ? [id] : [],
          );
          if (id && d) {
            saveDocsTreeUi({
              projectId: d.projectId,
              folderId: d.folderId ?? null,
              lastIulDocId: id,
            });
          }
        }}
        onMultiDocChange={setMultiDocIds}
        refreshKey={refreshKey}
        onLibraryChange={() => setRefreshKey((k) => k + 1)}
        onBatchCreateRequest={(p) => void handleBatchCreate(p)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pt-4 pb-4 sm:px-5 sm:pt-5 sm:pb-5 lg:px-6">
        <FadeIn className="flex min-h-0 flex-1 flex-col">
        <DocsContourBar
          product="info_sheet"
          title="Информационно-удостоверяющий лист"
          className="shrink-0"
          actions={
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={!projectId}
                onClick={() => {
                  if (!projectId) return;
                  setSignaturesOpen(false);
                  setRoleSettingsOpen(true);
                  if (!docId) setDocId(ensureDraftDoc(projectId));
                }}
                className="inline-flex items-center gap-1.5 !text-ink"
              >
                <Settings2 size={16} aria-hidden />
                Настройки
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!projectId}
                onClick={() => {
                  if (!projectId) return;
                  setRoleSettingsOpen(false);
                  setSignaturesOpen(true);
                  setDocId(null);
                  setFolderId(null);
                  setBatchDocIds([]);
                }}
                className={cn(
                  "shrink-0 !text-ink",
                  signaturesOpen && "border-brand bg-brand/15",
                )}
              >
                Библиотека подписей
              </Button>
            </>
          }
        />
        <div className="mb-3 shrink-0">
          <p className="text-pretty text-sm text-ink-muted">
            {signaturesOpen
              ? "Здесь хранятся картинки подписей по фамилиям для текущего проекта. Загрузите файл PNG или JPEG."
              : batchDocIds.length > 1
                ? "Открыто несколько листов сразу: слева в мастере переключайте файлы. Готовые листы скачиваются кнопкой сверху справа."
                : "Сначала нажмите «Настройки» (алгоритм и список ролей), затем загрузите PDF чертежа — поля заполнятся сами."}
          </p>
          {batchBusy ? (
            <p className="mt-2 text-sm text-brand">Создаём пакет ИУЛ…</p>
          ) : null}
          {batchMsg ? (
            <p className="mt-2 text-sm text-ink-soft">{batchMsg}</p>
          ) : null}
          {signaturesOpen ? (
            <button
              type="button"
              className="mt-2 text-sm text-brand hover:underline"
              onClick={() => {
                setSignaturesOpen(false);
                if (projectId) {
                  setDocId(ensureDraftDoc(projectId));
                }
              }}
            >
              ← Назад к документам
            </button>
          ) : null}
        </div>

        {!ready ? (
          <GlassCard className="p-6">
            <p className="text-sm text-ink-soft">Загрузка демо-проекта…</p>
          </GlassCard>
        ) : signaturesOpen && projectId ? (
          <SignatureLibraryTable
            projectId={projectId}
            projectName={projectName}
            refreshKey={refreshKey}
            onLibraryChange={() => setRefreshKey((k) => k + 1)}
          />
        ) : docId && doc && doc.kind === "info_sheet" ? (
          <div className="flex min-h-0 flex-1 flex-col">
          <InfoSheetWizard
            docId={docId}
            batchDocIds={
              batchDocIds.length > 1 ? batchDocIds : undefined
            }
            onSelectBatchDoc={(id) => setDocId(id)}
            libraryRefreshKey={refreshKey}
            onChanged={() => setRefreshKey((k) => k + 1)}
            roleSettingsOpen={roleSettingsOpen}
            onRoleSettingsOpenChange={setRoleSettingsOpen}
          />
          </div>
        ) : (
          <GlassCard className="p-6">
            <p className="text-pretty text-sm text-ink-soft">
              Открываем мастер ИУЛ…
            </p>
          </GlassCard>
        )}
        </FadeIn>
      </div>
    </div>
  );
}
