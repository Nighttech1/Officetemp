/** Заполнение мастера ИУЛ из PDF (хэш + штамп). */

import {
  applyProjectRoleSettings,
  emptyIulWizard,
  getDocument,
  getProject,
  projectDefaultHashAlgo,
  updateDocument,
  type InfoSheetHashAlgo,
  type InfoSheetSignature,
  type InfoSheetWizardState,
} from "@/lib/docs-store";
import {
  formatFileModifiedAt,
  applyFileModifiedDateToSignatures,
  hashBlob,
  mergeIzmIntoDesignation,
  normalizeIulVersion,
} from "@/lib/iul-hash";
import { findSignatureImage } from "@/lib/signature-library";
import { analyzeIulPdf, ApiError } from "@/lib/api";

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

export async function seedIulFromPdf(
  docId: string,
  file: File,
  opts?: { hashAlgo?: InfoSheetHashAlgo },
): Promise<{ ok: string; warn?: string }> {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Нужен файл PDF");
  }
  const doc = getDocument(docId);
  if (!doc) throw new Error("Документ не найден");
  const project = getProject(doc.projectId);
  const projectName = project?.name?.trim() || "";
  const algo =
    opts?.hashAlgo ??
    projectDefaultHashAlgo(doc.projectId);
  // Один проход хэша по копии байтов (длина как у одиночной загрузки).
  const digest = await hashBlob(file, algo);
  const stem = file.name.replace(/\.pdf$/i, "");
  const base = doc.iulWizard ?? emptyIulWizard();

  const meta: Partial<InfoSheetWizardState> = {
    sourceFileName: file.name,
    fileSizeBytes: file.size,
    fileModifiedAt: formatFileModifiedAt(file),
    fileHash: digest,
    hashAlgo: algo,
    objectName: projectName || base.objectName,
    signatureSource: "library",
    step: 1,
  };

  let stampPatch: Partial<InfoSheetWizardState> = {};
  let stampNote = "";
  try {
    const stamp = await analyzeIulPdf(file, { extractSignatures: false });
    const list =
      stamp.signatures.length > 0
        ? stamp.signatures
        : [{ role: "", surname: "", signed_at: "" }];
    const rawSigs: InfoSheetSignature[] = list.map((s) => ({
      role: s.role || "",
      surname: s.surname || "",
      signedAt: s.signed_at || "",
      note: "",
    }));
    stampPatch.signatures = applyFileModifiedDateToSignatures(
      withLibraryImages(
        doc.projectId,
        applyProjectRoleSettings(rawSigs, project?.iulSignSettings),
      ),
      meta.fileModifiedAt || "",
    );
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
    const parts = [
      stamp.doc_designation && `шифр ${stamp.doc_designation}`,
      stamp.signatures.length
        ? `${stamp.signatures.length} подписи`
        : null,
    ].filter(Boolean);
    stampNote = parts.length ? ` Штамп: ${parts.join(", ")}.` : "";
  } catch (e) {
    const msg =
      e instanceof ApiError
        ? e.detail
        : e instanceof Error
          ? e.message
          : "штамп не разобран";
    stampNote = ` Хэш заполнен; штамп: ${msg}`;
  }

  const cipher =
    stampPatch.ulCode ||
    stampPatch.docDesignation ||
    "";
  updateDocument(docId, {
    title: (cipher || `ИУЛ — ${stem}`).slice(0, 200),
    iulWizard: {
      ...meta,
      ...stampPatch,
      docDesignation:
        stampPatch.docDesignation ||
        base.docDesignation ||
        stem.slice(0, 80),
      docName:
        stampPatch.docName ||
        (base.docName && !/^\d{2}-\d{4}-/.test(base.docName) ? base.docName : "") ||
        "",
      // Пустая версия / «0» → пусто (в бланке «-»)
      docVersion: normalizeIulVersion(
        stampPatch.docVersion !== undefined
          ? stampPatch.docVersion
          : base.docVersion,
      ),
    },
  });

  return {
    ok: `Файл «${file.name}» прочитан.`,
    warn: stampNote || undefined,
  };
}
