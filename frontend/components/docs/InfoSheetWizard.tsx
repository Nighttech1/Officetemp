"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FileText, UserRound, X } from "lucide-react";
import {
  applyProjectRoleSettings,
  emptyIulWizard,
  getDocument,
  getProject,
  normalizeIulStep,
  projectDefaultHashAlgo,
  titleFromUlCipher,
  updateDocument,
  updateProjectIulSignSettings,
  type InfoSheetHashAlgo,
  type InfoSheetSignature,
  type InfoSheetWizardState,
} from "@/lib/docs-store";
import {
  expectedHashHexLen,
  formatFileModifiedAt,
  formatFileModifiedDisplay,
  applyFileModifiedDateToSignatures,
  hashBlob,
  hashFile,
  mergeIzmIntoDesignation,
  normalizeIulVersion,
  toHtmlDateValue,
} from "@/lib/iul-hash";
import { buildIulPdfBlob, iulPdfFilename } from "@/lib/iul-pdf";
import { buildZipBlob, zipFilename } from "@/lib/zip-download";
import {
  fileToDataUrl,
  findSignatureImage,
  upsertSignature,
} from "@/lib/signature-library";
import { analyzeIulPdf, ApiError } from "@/lib/api";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { StatusMessage } from "@/components/StatusMessage";
import { GlassCard } from "@/components/ui/GlassCard";
import { DocsStepMotion } from "@/components/docs/DocsStepMotion";
import { SlideTabs } from "@/components/ui/slide-tabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoSheetLivePreview } from "@/components/docs/InfoSheetLivePreview";
import { ResizablePreviewShell } from "@/components/docs/ResizablePreviewShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";

/** Лимит загрузки PDF для ИУЛ (C-103). */
export const IUL_MAX_PDF_BYTES = 100 * 1024 * 1024;
const STEPS = [
  { id: "1", n: 1 as const, label: "Файл" },
  { id: "2", n: 2 as const, label: "Документ" },
  { id: "3", n: 3 as const, label: "Подписи" },
];

const ALGOS: InfoSheetHashAlgo[] = ["MD5", "SHA-1", "SHA-256", "CRC32"];

type Props = {
  docId: string;
  /** Пакетный режим: несколько ИУЛ из PDF */
  batchDocIds?: string[];
  onSelectBatchDoc?: (id: string) => void;
  onChanged?: () => void;
  libraryRefreshKey?: number;
  /** C-206: настройки открываются с страницы у «Библиотека подписей» */
  roleSettingsOpen?: boolean;
  onRoleSettingsOpenChange?: (open: boolean) => void;
};

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

function ensureIul(docId: string): InfoSheetWizardState {
  const doc = getDocument(docId);
  if (doc?.iulWizard) {
    const step = normalizeIulStep(Number(doc.iulWizard.step) || 1);
    return { ...doc.iulWizard, step };
  }
  const created = updateDocument(docId, { iulWizard: emptyIulWizard() });
  return created?.iulWizard ?? emptyIulWizard();
}

function projectNameForDoc(docId: string): string {
  const doc = getDocument(docId);
  if (!doc) return "";
  return getProject(doc.projectId)?.name?.trim() || "";
}

function withLibraryImages(
  projectId: string,
  signatures: InfoSheetSignature[],
): InfoSheetSignature[] {
  return signatures.map((s) => ({
    ...s,
    signatureImageDataUrl: s.surname
      ? findSignatureImage(projectId, s.surname)
      : undefined,
  }));
}

export function InfoSheetWizard({
  docId,
  batchDocIds,
  onSelectBatchDoc,
  onChanged,
  libraryRefreshKey = 0,
  roleSettingsOpen: roleSettingsOpenProp,
  onRoleSettingsOpenChange,
}: Props) {
  const [iul, setIul] = useState<InfoSheetWizardState | null>(null);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const [sizeLimitOpen, setSizeLimitOpen] = useState(false);
  const [activeSig, setActiveSig] = useState("sig-0");
  const [roleSettingsOpenLocal, setRoleSettingsOpenLocal] = useState(false);
  const roleSettingsOpen = roleSettingsOpenProp ?? roleSettingsOpenLocal;
  const setRoleSettingsOpen = onRoleSettingsOpenChange ?? setRoleSettingsOpenLocal;
  const [stepsVertical, setStepsVertical] = useState(false);
  const [fixedRolesText, setFixedRolesText] = useState("");
  const [overflowRole, setOverflowRole] = useState("Прочие");
  const [defaultHashAlgo, setDefaultHashAlgo] =
    useState<InfoSheetHashAlgo>("MD5");
  const bufferRef = useRef<ArrayBuffer | null>(null);
  const sigUploadRef = useRef<HTMLInputElement>(null);
  const [sigUploadIndex, setSigUploadIndex] = useState<number | null>(null);

  const reload = useCallback(() => {
    const doc = getDocument(docId);
    setTitle(doc?.title ?? "");
    setProjectId(doc?.projectId ?? "");
    const pname = projectNameForDoc(docId);
    setProjectName(pname);
    const state = ensureIul(docId);
    const normalizedMod = formatFileModifiedDisplay(state.fileModifiedAt);
    const izmMerged = mergeIzmIntoDesignation(
      state.docDesignation,
      state.docVersion,
    );
    let syncedBase =
      pname && state.objectName !== pname
        ? { ...state, objectName: pname }
        : state;
    const patch: Partial<typeof state> = {};
    if (pname && state.objectName !== pname) {
      patch.objectName = pname;
    }
    if (normalizedMod && normalizedMod !== state.fileModifiedAt) {
      patch.fileModifiedAt = normalizedMod;
      syncedBase = { ...syncedBase, fileModifiedAt: normalizedMod };
    }
    // C-95: даты всех подписантов = дата изменения ИУЛ
    const unified = applyFileModifiedDateToSignatures(
      syncedBase.signatures,
      syncedBase.fileModifiedAt,
    );
    if (
      unified.some(
        (s, i) => s.signedAt !== syncedBase.signatures[i]?.signedAt,
      )
    ) {
      patch.signatures = unified;
      syncedBase = { ...syncedBase, signatures: unified };
    }
    if (
      izmMerged.designation !== state.docDesignation ||
      izmMerged.version !== state.docVersion
    ) {
      patch.docDesignation = izmMerged.designation;
      patch.docVersion = izmMerged.version;
      syncedBase = {
        ...syncedBase,
        docDesignation: izmMerged.designation,
        docVersion: izmMerged.version,
      };
    }
    if (Object.keys(patch).length) {
      updateDocument(docId, { iulWizard: patch });
    }
    const synced = syncedBase;
    if (doc?.projectId) {
      setIul({
        ...synced,
        step: normalizeIulStep(synced.step),
        signatureSource: "library",
        signatures: withLibraryImages(doc.projectId, synced.signatures),
      });
    } else {
      setIul({
        ...synced,
        step: normalizeIulStep(synced.step),
        signatureSource: "library",
      });
    }
  }, [docId]);

  useLayoutEffect(() => {
    reload();
    setError(null);
    setOk(null);
    bufferRef.current = null;
    setActiveSig("sig-0");
  }, [docId, reload]);

  useEffect(() => {
    if (!iul || !projectId) return;
    const next = withLibraryImages(projectId, iul.signatures);
    const changed = next.some(
      (s, i) =>
        s.signatureImageDataUrl !== iul.signatures[i]?.signatureImageDataUrl,
    );
    if (changed) {
      persist({ signatures: next, signatureSource: "library" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryRefreshKey, projectId]);

  function persist(
    patch: Partial<InfoSheetWizardState>,
    extra?: { title?: string; status?: "draft" | "ready" },
  ) {
    const mergedForTitle = {
      ...(iul ?? emptyIulWizard()),
      ...patch,
    };
    const autoTitle = titleFromUlCipher(mergedForTitle);
    // Tree refresh only when label-affecting fields change (C-221)
    const treeKeys = new Set([
      "docDesignation",
      "ulCode",
      "docName",
    ]);
    const bumpTree =
      Boolean(extra?.title) ||
      Object.keys(patch).some((k) => treeKeys.has(k));
    const updated = updateDocument(docId, {
      iulWizard: { ...patch, signatureSource: "library" },
      title: extra?.title ?? autoTitle ?? undefined,
      status: extra?.status,
    });
    if (updated?.iulWizard) {
      setIul({
        ...updated.iulWizard,
        step: normalizeIulStep(updated.iulWizard.step),
        signatureSource: "library",
      });
      setTitle(updated.title);
      if (bumpTree) onChanged?.();
    }
  }

  function setStep(step: InfoSheetWizardState["step"]) {
    persist({ step });
  }

  function buildSigsFromStamp(
    stampSigs: {
      role: string;
      surname: string;
      signed_at: string;
    }[],
    pid: string,
  ): InfoSheetSignature[] {
    const list =
      stampSigs.length > 0
        ? stampSigs
        : [{ role: "", surname: "", signed_at: "" }];
    const raw = list.map((s) => ({
      role: s.role || "",
      surname: s.surname || "",
      signedAt: s.signed_at || "",
      note: "",
    }));
    const settings = getProject(pid)?.iulSignSettings;
    return withLibraryImages(pid, applyProjectRoleSettings(raw, settings));
  }

  function withUnifiedSignDates(
    sigs: InfoSheetSignature[],
    fileModifiedAt: string,
  ): InfoSheetSignature[] {
    return applyFileModifiedDateToSignatures(sigs, fileModifiedAt);
  }

  async function applyFile(file: File) {
    setError(null);
    setOk(null);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Нужен файл PDF (подписанный ЭЦП).");
      return;
    }
    if (file.size > IUL_MAX_PDF_BYTES) {
      setSizeLimitOpen(true);
      return;
    }
    setBusy(true);
    try {
      const algo =
        iul?.hashAlgo ||
        projectDefaultHashAlgo(projectId || getDocument(docId)?.projectId);
      const digest = await hashBlob(file, algo);
      // Keep a copy for algo switch re-hash (not the live File buffer).
      bufferRef.current = (await file.arrayBuffer()).slice(0);
      const meta = {
        sourceFileName: file.name,
        fileSizeBytes: file.size,
        fileModifiedAt: formatFileModifiedAt(file),
        fileHash: digest,
        hashAlgo: algo,
        objectName: projectName || projectNameForDoc(docId),
        signatureSource: "library" as const,
      };
      const rename =
        !title || title.startsWith("ИУЛ") || title === "Новый документ";
      const stem = file.name.replace(/\.pdf$/i, "");

      let stampPatch: Partial<InfoSheetWizardState> = {};
      let stampNote = "";
      const pid = projectId || getDocument(docId)?.projectId || "";
      try {
        const stamp = await analyzeIulPdf(file, { extractSignatures: false });
        const sigs = buildSigsFromStamp(stamp.signatures, pid);
        stampPatch = {};
        if (stamp.doc_designation)
          stampPatch.docDesignation = stamp.doc_designation;
        if (stamp.doc_name) stampPatch.docName = stamp.doc_name;
        {
          const merged = mergeIzmIntoDesignation(
            stampPatch.docDesignation || stamp.doc_designation || "",
            stamp.doc_version || "",
          );
          if (merged.designation) stampPatch.docDesignation = merged.designation;
          stampPatch.docVersion = merged.version;
        }
        if (stamp.ul_code) stampPatch.ulCode = stamp.ul_code;
        stampPatch.signatures = withUnifiedSignDates(
          sigs,
          meta.fileModifiedAt,
        );
        setActiveSig("sig-0");
        const parts = [
          stamp.doc_designation && `шифр ${stamp.doc_designation}`,
          stamp.signatures.length
            ? `${stamp.signatures.length} подписи (все листы)`
            : null,
          stamp.source_page ? `стр. ${stamp.source_page}` : null,
        ].filter(Boolean);
        stampNote = parts.length ? ` Штамп: ${parts.join(", ")}.` : "";
        if (stamp.warnings?.length) {
          stampNote += ` (${stamp.warnings.join("; ")})`;
        }
      } catch (e) {
        const msg =
          e instanceof ApiError
            ? e.detail
            : e instanceof Error
              ? e.message
              : "штамп не разобран";
        stampNote = ` Хэш заполнен; штамп: ${msg}`;
      }

      const cipherTitle =
        titleFromUlCipher({
          ...(iul ?? emptyIulWizard()),
          ...stampPatch,
        }) ||
        stampPatch.ulCode ||
        stampPatch.docDesignation ||
        null;

      persist(
        { ...meta, ...stampPatch },
        rename
          ? {
              title: (cipherTitle || `ИУЛ — ${stem}`).slice(0, 200),
            }
          : cipherTitle
            ? { title: cipherTitle.slice(0, 200) }
            : undefined,
      );
      setOk(
        "Файл прочитан: хэш и характеристики заполнены." +
          stampNote +
          " Наименование объекта = название проекта.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось прочитать PDF");
    } finally {
      setBusy(false);
    }
  }

  async function onAlgoChange(algo: InfoSheetHashAlgo) {
    persist({ hashAlgo: algo });
    if (!bufferRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const digest = await hashFile(bufferRef.current, algo);
      persist({ hashAlgo: algo, fileHash: digest });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка пересчёта хэша");
    } finally {
      setBusy(false);
    }
  }

  function updateSig(index: number, patch: Partial<InfoSheetSignature>) {
    if (!iul) return;
    const pid = projectId;
    const next = iul.signatures.map((s, i) => {
      if (i !== index) return s;
      const merged = { ...s, ...patch };
      if (patch.surname !== undefined) {
        merged.signatureImageDataUrl = merged.surname
          ? findSignatureImage(pid, merged.surname)
          : undefined;
      }
      return merged;
    });
    persist({ signatures: next });
  }

  function addSig() {
    if (!iul) return;
    const next = [
      ...iul.signatures,
      { role: "", surname: "", signedAt: "", note: "" },
    ];
    persist({ signatures: next });
    setActiveSig(`sig-${next.length - 1}`);
  }

  function removeSig(index: number) {
    if (!iul) return;
    const next = iul.signatures.filter((_, i) => i !== index);
    const list =
      next.length > 0
        ? next
        : [{ role: "", surname: "", signedAt: "", note: "" }];
    persist({ signatures: list });
    setActiveSig(`sig-0`);
  }

  async function onGenerate() {
    if (!iul) return;
    setError(null);
    setOk(null);

    const ids =
      batchDocIds && batchDocIds.length > 1 ? batchDocIds : [docId];
    const isBatch = ids.length > 1;

    setBusy(true);
    try {
      const zipEntries: { name: string; data: Uint8Array }[] = [];
      const notes: string[] = [];

      for (const id of ids) {
        const doc = getDocument(id);
        const w = doc?.iulWizard;
        if (!w) {
          throw new Error(`Нет данных мастера для документа`);
        }
        if (!w.sourceFileName || !w.fileHash) {
          setError(
            isBatch
              ? `В пакете есть ИУЛ без PDF («${doc.title}»). Откройте вкладку и загрузите файл.`
              : "Сначала загрузите PDF на шаге 1 (нужны имя файла и хэш).",
          );
          if (isBatch) onSelectBatchDoc?.(id);
          setStep(1);
          return;
        }
        const pname =
          getProject(doc.projectId)?.name?.trim() || w.objectName;
        const obj = pname.trim();
        if (!obj) {
          setError("У проекта нет названия — задайте имя проекта слева.");
          setStep(2);
          return;
        }
        if (!w.docDesignation.trim() || !w.docName.trim()) {
          setError(
            isBatch
              ? `Заполните обозначение и наименование в «${doc.title}».`
              : "Заполните обозначение и наименование документа.",
          );
          if (isBatch) onSelectBatchDoc?.(id);
          setStep(2);
          return;
        }
        const forPdf = {
          ...w,
          objectName: obj,
          signatureSource: "library" as const,
        };
        const blob = await buildIulPdfBlob(forPdf);
        const name = iulPdfFilename(forPdf);
        if (isBatch) {
          const buf = new Uint8Array(await blob.arrayBuffer());
          zipEntries.push({ name, data: buf });
          notes.push(name);
        } else {
          triggerDownload(blob, name);
          notes.push(`Скачан ${name} (${blob.size} байт)`);
        }
        updateDocument(id, {
          status: "ready",
          iulWizard: {
            lastGenerateNote: isBatch
              ? `В архиве: ${name}`
              : `Скачан ${name} (${blob.size} байт)`,
            objectName: obj,
          },
        });
      }

      if (isBatch) {
        const zipBlob = buildZipBlob(zipEntries);
        const zname = zipFilename();
        triggerDownload(zipBlob, zname);
        const summary = `Скачан архив ${zname}: ${zipEntries.length} ИУЛ (${zipBlob.size} байт)`;
        setOk(summary);
        if (ids.includes(docId)) {
          persist({ lastGenerateNote: summary }, { status: "ready" });
        }
      } else {
        setOk(notes[0] ?? "Готово");
        if (ids.includes(docId)) reload();
      }
      onChanged?.();
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сформировать PDF");
    } finally {
      setBusy(false);
    }
  }

  const slideItems = useMemo(
    () => STEPS.map((s) => ({ id: s.id, label: s.label })),
    [],
  );

  function hydrateRoleSettingsForm() {
    const p = getProject(projectId);
    const s = p?.iulSignSettings;
    setFixedRolesText((s?.fixedRoles ?? []).join("\n"));
    setOverflowRole(s?.overflowRole || "Прочие");
    setDefaultHashAlgo(s?.defaultHashAlgo ?? "MD5");
  }

  // До любого early-return: иначе при iul=null → hooks order crash
  // («Rendered more hooks than during the previous render»).
  useEffect(() => {
    if (!roleSettingsOpen || !projectId) return;
    hydrateRoleSettingsForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleSettingsOpen, projectId]);

  if (!iul) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-ink-soft">Загрузка мастера ИУЛ…</p>
      </GlassCard>
    );
  }

  const stepIndex = Math.max(0, Math.min(STEPS.length - 1, iul.step - 1));
  const previewWizard = {
    ...iul,
    objectName: projectName || iul.objectName,
  };
  const isBatch = Boolean(batchDocIds && batchDocIds.length > 1);
  const batchTabs = isBatch
    ? (batchDocIds ?? []).map((id) => {
        const d = getDocument(id);
        const label =
          d?.iulWizard?.sourceFileName ||
          d?.title ||
          id;
        return { id, label };
      })
    : [];
  const generateLabel = isBatch ? "Сформировать ИУЛы" : "Сформировать PDF";

  function saveRoleSettings() {
    const roles = fixedRolesText
      .split(/[\n,;]+/)
      .map((r) => r.trim())
      .filter(Boolean);
    updateProjectIulSignSettings(projectId, {
      fixedRoles: roles,
      overflowRole: overflowRole.trim() || "Прочие",
      defaultHashAlgo,
    });
    // Если файл ещё не загружен — сразу ставим стартовый алгоритм в черновик
    if (!bufferRef.current && !iul?.fileHash) {
      persist({ hashAlgo: defaultHashAlgo });
    }
    setRoleSettingsOpen(false);
    setOk(
      `Настройки сохранены для проекта (алгоритм ${defaultHashAlgo}` +
        (roles.length ? `, характеров: ${roles.length}` : "") +
        "). Новые и пакетные ИУЛ их учтут.",
    );
    onChanged?.();
  }

  async function onUploadSignatureImage(index: number, file: File) {
    if (!iul || !projectId) return;
    setError(null);
    try {
      if (!file.type.startsWith("image/")) {
        setError("Нужен файл PNG или JPEG");
        return;
      }
      const surname = iul.signatures[index]?.surname?.trim();
      if (!surname) {
        setError("Сначала укажите фамилию — по ней подпись попадёт в библиотеку.");
        return;
      }
      const dataUrl = await fileToDataUrl(file);
      upsertSignature(projectId, surname, dataUrl);
      updateSig(index, { signatureImageDataUrl: dataUrl });
      setOk(`Подпись для «${surname}» сохранена в общую библиотеку подписей.`);
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить подпись");
    }
  }

  function wrapWithBatchTabs(body: ReactNode) {
    if (!isBatch) return body;
    return (
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-2">
        <div className="flex h-auto w-full flex-row flex-wrap gap-1 sm:w-52 sm:shrink-0 sm:flex-col sm:flex-nowrap">
          {batchTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectBatchDoc?.(t.id)}
              className={cn(
                "relative flex w-full items-center justify-start gap-1.5 rounded-md px-2 py-2 text-left text-sm transition-colors",
                t.id === docId
                  ? "bg-surface-muted text-ink after:absolute after:inset-y-0 after:start-0 after:w-0.5 after:bg-brand"
                  : "text-ink-muted hover:bg-surface-muted hover:text-ink",
              )}
              title={t.label}
            >
              <FileText
                className="-ms-0.5 me-0.5 shrink-0 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden
              />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="min-w-0 grow">{body}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-stretch gap-4 lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        {/* C-212: SlideTabs + generate sit above GlassCard (where page h1 was) */}
        <div
          data-slide-tabs-fit
          className="flex w-full min-w-0 shrink-0 flex-col gap-3"
        >
          {stepsVertical ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Button loading={busy} onClick={() => void onGenerate()}>
                {generateLabel}
              </Button>
            </div>
          ) : null}
          <div
            className={cn(
              "flex gap-4",
              stepsVertical ? "flex-row items-start" : "flex-col",
            )}
          >
            <div
              className={cn(
                "min-w-0",
                stepsVertical ? "w-[9.5rem] shrink-0 sm:w-40" : "w-full",
              )}
            >
              <div
                className={cn(
                  !stepsVertical &&
                    "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                )}
              >
                <SlideTabs
                  tabs={slideItems}
                  selected={stepIndex}
                  onSelect={(i) => setStep(STEPS[i].n)}
                  aria-label="Шаги мастера ИУЛ"
                  layout="auto"
                  onOrientationChange={setStepsVertical}
                  className={cn(stepsVertical ? "w-full" : "min-w-0 flex-1")}
                />
                {!stepsVertical ? (
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
                    <Button loading={busy} onClick={() => void onGenerate()}>
                      {generateLabel}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <GlassCard className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pt-6 sm:p-5 sm:pt-7">
          <StatusMessage message={error} tone="error" />
          <StatusMessage message={ok} tone="ok" />

          {roleSettingsOpen ? (
            <div className="rounded-xl border border-line bg-surface-muted/40 p-4">
              <p className="text-sm font-medium text-ink">
                Настройки ИУЛ для этого проекта
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Сначала задайте алгоритм и характеры работы — потом пакетная
                загрузка PDF подхватит их автоматически.
              </p>
              <fieldset className="mt-3 flex flex-col gap-2">
                <legend className="text-sm font-medium text-ink">
                  Базовый стартовый алгоритм хэширования
                </legend>
                <div className="flex flex-wrap gap-2">
                  {ALGOS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setDefaultHashAlgo(a)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium",
                        defaultHashAlgo === a
                          ? "border-brand bg-brand/15 text-ink"
                          : "border-line text-ink-muted hover:bg-surface-muted",
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-ink-muted">
                  По умолчанию MD5 (32 символа). Пакетная загрузка использует
                  этот алгоритм.
                </p>
              </fieldset>
              <label className="mt-3 block text-sm text-ink">
                Фиксированный набор характеров работы
                <textarea
                  className="mt-1 w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
                  rows={5}
                  value={fixedRolesText}
                  onChange={(e) => setFixedRolesText(e.target.value)}
                  placeholder={"Разработал\nПроверил\nГIP"}
                />
              </label>
              <p className="mt-1 text-xs text-ink-muted">
                Каждый характер с новой строки. Пустой список — брать роли как
                в PDF.
              </p>
              <div className="mt-3">
                <Field
                  label="Куда писать остальные найденные роли"
                  value={overflowRole}
                  onChange={(e) => setOverflowRole(e.target.value)}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" onClick={saveRoleSettings}>
                  Сохранить для проекта
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setRoleSettingsOpen(false)}
                >
                  Отмена
                </Button>
              </div>
            </div>
          ) : null}

          <DocsStepMotion
            stepKey={iul.step}
            scopeKey={docId}
            className="scrollbar-brand flex min-h-0 flex-1 flex-col overflow-y-auto"
          >
          {iul.step === 1 ? (
            wrapWithBatchTabs(
              <div className="flex min-h-0 flex-1 flex-col gap-4">
                <div>
                  <h2 className="text-base font-semibold text-ink">
                    1. Загрузка PDF с ЭЦП
                  </h2>
                  <p className="mt-1 text-pretty text-sm text-ink-soft">
                    {isBatch
                      ? "Пакетный режим: слева список ИУЛ (как подписанты). Справа — мастер выбранного файла."
                      : "Загрузите подписанный PDF. Хэш считается в браузере; штампы читаются со всех листов."}
                  </p>
                </div>
                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!busy) setDropActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!busy) setDropActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDropActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDropActive(false);
                    if (busy) return;
                    const f = e.dataTransfer.files?.[0];
                    if (f) void applyFile(f);
                  }}
                >
                  <label
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center transition-colors",
                      dropActive
                        ? "border-brand bg-brand/15"
                        : "border-line bg-surface-muted/40 hover:border-brand/50",
                      busy && "pointer-events-none opacity-60",
                    )}
                  >
                    <span className="text-sm font-medium text-ink">
                      {busy
                        ? "Вычисление хэша…"
                        : dropActive
                          ? "Отпустите PDF здесь"
                          : isBatch
                            ? "Выберите или перетащите PDF (замена у выбранного ИУЛ)"
                            : "Выберите или перетащите PDF"}
                    </span>
                    <span className="text-xs text-ink-muted">
                      Только .pdf · до 100 МБ · хэш в браузере
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      disabled={busy}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void applyFile(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>

                <fieldset className="flex flex-col gap-2">
                  <legend className="text-sm font-medium text-ink">
                    Алгоритм хэширования
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {ALGOS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        disabled={busy}
                        onClick={() => void onAlgoChange(a)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs font-medium",
                          iul.hashAlgo === a
                            ? "border-brand bg-brand/15 text-ink"
                            : "border-line text-ink-muted hover:bg-surface-muted",
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <Field
                  label="Хэш файла"
                  value={iul.fileHash}
                  onChange={(e) => persist({ fileHash: e.target.value })}
                  hint={`Автоматически · ${iul.hashAlgo} · ожидаемая длина ${expectedHashHexLen(iul.hashAlgo)} символов`}
                />
                <Field
                  label="Наименование файла"
                  value={iul.sourceFileName}
                  onChange={(e) =>
                    persist({ sourceFileName: e.target.value })
                  }
                />
                <Field
                  label="Дата и время последнего изменения файла"
                  value={iul.fileModifiedAt}
                    onChange={(e) => {
                      const fileModifiedAt = e.target.value;
                      persist({
                        fileModifiedAt,
                        signatures: withUnifiedSignDates(
                          iul.signatures,
                          fileModifiedAt,
                        ),
                      });
                    }}
                  hint="Формат ДД-ММ-ГГГГ (и время при необходимости)"
                />
                <Field
                  label="Размер файла (байт)"
                  type="number"
                  value={iul.fileSizeBytes ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    persist({
                      fileSizeBytes: v === "" ? null : Number(v),
                    });
                  }}
                />

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!iul.fileHash && !iul.sourceFileName}
                  >
                    Далее: документ
                  </Button>
                </div>
              </div>,
            )
          ) : null}

          {iul.step === 2
            ? wrapWithBatchTabs(
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-ink">
                      2. Документ и объект
                    </h2>
                    <p className="mt-1 text-sm text-ink-soft">
                      Наименование объекта = название проекта. Ниже — строка
                      таблицы документов.
                    </p>
                  </div>
                  <Field
                    label="Наименование объекта *"
                    value={projectName || iul.objectName}
                    readOnly
                    hint="Меняется при переименовании проекта в меню слева"
                  />
                  <p className="text-xs text-ink-muted">№ п/п: 1</p>
                  <Field
                    label="Обозначение документа *"
                    value={iul.docDesignation}
                    onChange={(e) =>
                      persist({ docDesignation: e.target.value })
                    }
                    hint="Полный шифр со всеми приписками (Изм. N и т.п.)"
                  />
                  <Field
                    label="Наименование документа *"
                    value={iul.docName}
                    onChange={(e) => persist({ docName: e.target.value })}
                    hint="Название раздела буквами, не шифр"
                  />
                  <Field
                    label="Номер последнего изменения (версии)"
                    value={iul.docVersion}
                    onChange={(e) =>
                      persist({
                        docVersion: normalizeIulVersion(e.target.value),
                      })
                    }
                    placeholder="пусто → в бланке «-»"
                    hint="Если не заполнено — в ИУЛ будет «-» (не 0)"
                  />
                  <Field
                    label="Обозначение УЛ (шифр)"
                    value={iul.ulCode}
                    onChange={(e) => persist({ ulCode: e.target.value })}
                    hint="Пример: Раздел ПД №12_ССРСС_УЛ — раньше было на шаге PDF"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Лист"
                      value={iul.sheetNo}
                      onChange={(e) => persist({ sheetNo: e.target.value })}
                    />
                    <Field
                      label="Листов"
                      value={iul.sheetsTotal}
                      onChange={(e) => persist({ sheetsTotal: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between gap-2">
                    <Button variant="secondary" onClick={() => setStep(1)}>
                      Назад
                    </Button>
                    <Button onClick={() => setStep(3)}>Далее: подписи</Button>
                  </div>
                </div>,
              )
            : null}

          {iul.step === 3
            ? wrapWithBatchTabs(
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-ink">
                      3. Подписи
                    </h2>
                    <p className="mt-1 text-sm text-ink-soft">
                      Сверху слева выберите роль (например «Разработал») или
                      добавьте новую. Ниже заполните фамилию и дату. Картинка
                      подписи подставится из библиотеки по фамилии. Готовый
                      лист скачивается кнопкой «{generateLabel}» сверху справа.
                    </p>
                  </div>

                  <input
                    ref={sigUploadRef}
                    type="file"
                    accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      const idx = sigUploadIndex;
                      e.target.value = "";
                      setSigUploadIndex(null);
                      if (f != null && idx != null) {
                        void onUploadSignatureImage(idx, f);
                      }
                    }}
                  />

                  <Tabs
                    value={activeSig}
                    onValueChange={setActiveSig}
                    className="flex w-full flex-col items-start gap-3"
                  >
                    <TabsList
                      className="!flex h-auto !w-full !flex-row !flex-wrap !items-start !justify-start gap-1 rounded-none bg-transparent px-0 py-0 text-ink"
                      onMouseMove={(e) => {
                        // C-135: плавная смена как у SlideTabs — только пока курсор на списке
                        const list = e.currentTarget;
                        const rows = list.querySelectorAll<HTMLElement>(
                          "[data-sig-row]",
                        );
                        let hit: string | null = null;
                        for (const row of rows) {
                          const r = row.getBoundingClientRect();
                          if (
                            e.clientY >= r.top &&
                            e.clientY < r.bottom &&
                            e.clientX >= r.left &&
                            e.clientX < r.right
                          ) {
                            hit = row.dataset.sigRow ?? null;
                            break;
                          }
                        }
                        if (hit && hit !== activeSig) setActiveSig(hit);
                      }}
                    >
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={addSig}
                        className="h-8 shrink-0"
                      >
                        + Добавить
                      </Button>
                      {iul.signatures.map((s, i) => (
                        <div
                          key={i}
                          data-sig-row={`sig-${i}`}
                          className="relative flex w-auto max-w-[12rem] items-stretch gap-0.5"
                        >
                          <TabsTrigger
                            value={`sig-${i}`}
                            className="relative min-w-0 flex-1 justify-start after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 hover:bg-surface-muted hover:text-ink data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-brand data-[state=active]:hover:bg-surface-muted"
                          >
                            <UserRound
                              className="-ms-0.5 me-1.5 shrink-0 opacity-60"
                              size={16}
                              strokeWidth={2}
                              aria-hidden
                            />
                            <span className="truncate">
                              {s.role.trim() || `Роль ${i + 1}`}
                            </span>
                          </TabsTrigger>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-danger/15 hover:text-danger"
                            title="Удалить"
                            aria-label={`Удалить ${s.role || i + 1}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeSig(i);
                            }}
                          >
                            <X size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      ))}
                    </TabsList>
                    <div className="min-w-0 w-full grow rounded-lg border border-line text-start">
                      {iul.signatures.map((s, i) => (
                        <TabsContent
                          key={i}
                          value={`sig-${i}`}
                          className="mt-0 space-y-3 px-4 py-3 focus-visible:outline-none data-[state=inactive]:hidden"
                        >
                          <Field
                            label="Характер работы"
                            id={`iul-role-${i}`}
                            value={s.role}
                            onChange={(e) =>
                              updateSig(i, { role: e.target.value })
                            }
                          />
                          <Field
                            label="Фамилия"
                            id={`iul-surname-${i}`}
                            value={s.surname}
                            onChange={(e) =>
                              updateSig(i, { surname: e.target.value })
                            }
                          />
                          <Field
                            label="Дата подписания"
                            id={`iul-date-${i}`}
                            type="date"
                            value={toHtmlDateValue(s.signedAt)}
                            onChange={(e) =>
                              updateSig(i, { signedAt: e.target.value })
                            }
                          />
                          <Field
                            label="Подпись (текст, если нет картинки)"
                            id={`iul-note-${i}`}
                            value={s.note}
                            onChange={(e) =>
                              updateSig(i, { note: e.target.value })
                            }
                          />
                          {s.signatureImageDataUrl ? (
                            <div className="rounded-lg border border-line bg-white p-2">
                              <p className="mb-1 text-xs text-ink-muted">
                                Из общей библиотеки (по фамилии)
                              </p>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={s.signatureImageDataUrl}
                                alt={`Подпись ${s.surname}`}
                                className="h-12 max-w-full object-contain"
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                className="mt-2"
                                onClick={() => {
                                  setSigUploadIndex(i);
                                  sigUploadRef.current?.click();
                                }}
                              >
                                Заменить подпись PNG/JPEG
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs text-ink-muted">
                                Нет картинки для «{s.surname || "…"}» в
                                библиотеке.
                              </p>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                  setSigUploadIndex(i);
                                  sigUploadRef.current?.click();
                                }}
                              >
                                Загрузить подпись в PNG/JPEG
                              </Button>
                            </div>
                          )}
                        </TabsContent>
                      ))}
                    </div>
                  </Tabs>

                  <div className="flex flex-wrap justify-between gap-2">
                    <Button variant="secondary" onClick={() => setStep(2)}>
                      Назад
                    </Button>
                    <Button loading={busy} onClick={() => void onGenerate()}>
                      {generateLabel}
                    </Button>
                  </div>
                </div>,
              )
            : null}
          </DocsStepMotion>
        </GlassCard>
      </div>

      <ResizablePreviewShell
        storageKeyPrefix="iul"
      >
        <InfoSheetLivePreview
          wizard={previewWizard}
          title={title}
          className="h-auto"
        />
      </ResizablePreviewShell>

      <ConfirmDialog
        open={sizeLimitOpen}
        title="Файл слишком большой"
        description={
          <>
            Максимальный размер PDF для ИУЛ —{" "}
            <strong>100 МБ</strong>. Выберите файл меньшего размера.
          </>
        }
        confirmLabel="Понятно"
        cancelLabel="Закрыть"
        tone="default"
        onConfirm={() => setSizeLimitOpen(false)}
        onCancel={() => setSizeLimitOpen(false)}
      />
    </div>
  );
}
