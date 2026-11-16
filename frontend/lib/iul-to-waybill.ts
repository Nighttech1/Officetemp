/** Строки накладной из выбранных ИУЛ + автостыковка тегов шаблона. */

import {
  createDocument,
  getDocument,
  loadDocTemplate,
  saveDocTemplate,
  updateDocument,
  type DocItem,
  type InfoSheetWizardState,
} from "@/lib/docs-store";
import { analyzeTemplate } from "@/lib/api";

export const IUL_WAYBILL_COLUMNS = [
  "обозначение",
  "наименование",
  "объект",
  "шифр_ул",
  "версия",
  "файл",
  "хэш",
  "дата_изменения",
  "размер",
] as const;

export type IulWaybillColumn = (typeof IUL_WAYBILL_COLUMNS)[number];

export function iulWizardToRow(
  w: InfoSheetWizardState,
): Record<string, string> {
  return {
    обозначение: w.docDesignation || "",
    наименование: w.docName || "",
    объект: w.objectName || "",
    шифр_ул: w.ulCode || w.docDesignation || "",
    версия: w.docVersion || "",
    файл: w.sourceFileName || "",
    хэш: w.fileHash || "",
    дата_изменения: w.fileModifiedAt || "",
    размер: w.fileSizeBytes != null ? String(w.fileSizeBytes) : "",
  };
}

function extractFlatTags(rawTags: unknown[]): string[] {
  const tags: string[] = [];
  for (const t of rawTags) {
    if (typeof t === "string") {
      tags.push(t);
      continue;
    }
    if (t && typeof t === "object") {
      const o = t as { name?: string; kind?: string };
      if (
        o.kind === "tr_for" ||
        o.kind === "for" ||
        o.kind === "if" ||
        o.kind === "other"
      ) {
        continue;
      }
      if (o.name) tags.push(o.name);
    }
  }
  return [...new Set(tags)];
}

/** Спец-источник стыковки: порядковый номер строки в выбранном диапазоне (1…n). */
export const SEQ_COLUMN = "__seq__";

/** Простая автостыковка: тег шаблона ↔ колонка по нормализованному имени. */
export function autoMapTagsToColumns(
  tags: string[],
  columns: string[],
): Record<string, string> {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[{}\s_\-./\\]+/g, "")
      .replace(/ё/g, "е")
      .replace(/№/g, "n")
      .replace(/п\/п/g, "pp");
  const colByNorm = new Map(columns.map((c) => [norm(c), c]));
  const mapping: Record<string, string> = {};
  const seqTagNorms = new Set(
    [
      "n",
      "pp",
      "пп",
      "п_п",
      "number",
      "num",
      "row",
      "index",
      "rownum",
      "seq",
      "nopп",
      "пnп",
    ].map(norm),
  );
  for (const extra of ["№", "п/п", "№п/п", "№ п/п"]) {
    seqTagNorms.add(norm(extra));
  }

  const aliases: Record<string, string[]> = {
    обозначение: [
      "обозначение",
      "шифр",
      "шифрраздела",
      "cipher",
      "designation",
      "docdesignation",
      "code",
      "codenumber",
    ],
    наименование: [
      "наименование",
      "наименованиекомплекта",
      "название",
      "name",
      "docname",
      "sectionname",
      "section",
      "section_name",
    ],
    invoice_number: ["invoicenumber", "номернакладной"],
    invoice_date: ["invoicedate", "датанакладной"],
    объект: ["объект", "object", "objectname", "проект"],
    шифр_ул: ["шифрул", "ulcode", "ул", "ul"],
    версия: ["версия", "version", "изм"],
    файл: ["файл", "file", "filename", "source"],
    хэш: ["хэш", "hash", "хеш", "hashsum", "digest"],
    дата_изменения: [
      "датаизменения",
      "signed",
      "датаподписания",
      "filemodified",
    ],
    размер: ["размер", "size", "filesize"],
  };
  // Не держим ключи-алиасы `code`/`section_name` как целевые колонки —
  // они не существуют в IUL_WAYBILL_COLUMNS и ломали стыковку.
  for (const tag of tags) {
    const tn = norm(tag);
    if (seqTagNorms.has(tn)) {
      mapping[tag] = SEQ_COLUMN;
      continue;
    }
    // Явные мосты шаблон накладной ↔ колонки ИУЛ / таблицы
    if (tn === "code" || tn === "codenumber") {
      const prefer =
        columns.find((c) => norm(c) === "обозначение") ||
        columns.find((c) => norm(c).includes("шифр") && !norm(c).includes("ул")) ||
        columns.find((c) => norm(c).includes("code"));
      if (prefer) {
        mapping[tag] = prefer;
        continue;
      }
    }
    if (
      tn === "sectionname" ||
      tn === "section" ||
      tn.includes("sectionname") ||
      tn === "наименованиекомплекта"
    ) {
      const prefer =
        columns.find((c) => norm(c) === "наименование") ||
        columns.find((c) => norm(c).includes("наименован")) ||
        columns.find((c) => norm(c).includes("section"));
      if (prefer) {
        mapping[tag] = prefer;
        continue;
      }
    }
    let hit = colByNorm.get(tn);
    if (!hit) {
      // прямое совпадение с колонками вроде "code number" / "section name"
      for (const col of columns) {
        const cn = norm(col);
        if (
          (tn.includes("code") && cn.includes("code")) ||
          (tn.includes("section") && cn.includes("section")) ||
          (tn.includes("шифр") && (cn.includes("шифр") || cn.includes("code"))) ||
          (tn.includes("наименован") &&
            (cn.includes("наименован") || cn.includes("section")))
        ) {
          hit = col;
          break;
        }
      }
    }
    if (!hit) {
      for (const [col, keys] of Object.entries(aliases)) {
        if (keys.some((k) => tn.includes(norm(k)) || norm(k).includes(tn))) {
          // сначала колонка файла с таким именем/алиасом
          const fileHit = columns.find((c) =>
            keys.some(
              (k) =>
                norm(c).includes(norm(k)) || norm(k).includes(norm(c)),
            ),
          );
          if (fileHit) {
            hit = fileHit;
            break;
          }
          if (columns.includes(col)) {
            hit = col;
            break;
          }
        }
      }
    }
    if (!hit) {
      for (const col of columns) {
        if (tn.includes(norm(col)) || norm(col).includes(tn)) {
          hit = col;
          break;
        }
      }
    }
    mapping[tag] = hit ?? "";
  }
  return mapping;
}

/**
 * Создаёт накладную в папке «Накладные» проекта:
 * строки = поля выбранных ИУЛ; шаблон копируется / анализируется.
 */
export async function createWaybillFromIuls(opts: {
  projectId: string;
  iulDocIds: string[];
  templateDonorDocId?: string | null;
  templateFile?: File | null;
}): Promise<DocItem> {
  const rows: Record<string, unknown>[] = [];
  for (const id of opts.iulDocIds) {
    const d = getDocument(id);
    if (!d || d.kind !== "info_sheet" || !d.iulWizard) continue;
    rows.push(iulWizardToRow(d.iulWizard));
  }
  if (!rows.length) {
    throw new Error("Выберите хотя бы один ИУЛ с данными");
  }

  const title = `Накладная из ИУЛ (${rows.length})`.slice(0, 200);
  const doc = createDocument(
    opts.projectId,
    "waybill",
    title,
    null,
  );

  let templateName = "";
  let tags: string[] = [];
  let mapping: Record<string, string> = {};
  const columns = [...IUL_WAYBILL_COLUMNS];

  async function applyTemplateFile(file: File) {
    templateName = file.name;
    await saveDocTemplate(doc.id, file);
    try {
      const analyzed = await analyzeTemplate(file);
      tags = extractFlatTags(analyzed.tags as unknown[]);
    } catch {
      tags = [];
    }
    mapping = autoMapTagsToColumns(tags, columns);
  }

  if (opts.templateFile) {
    await applyTemplateFile(opts.templateFile);
  } else if (opts.templateDonorDocId) {
    const donorFile = await loadDocTemplate(opts.templateDonorDocId);
    const donor = getDocument(opts.templateDonorDocId);
    if (donorFile) {
      await applyTemplateFile(donorFile);
      if (!tags.length && donor?.wizard.tags?.length) {
        tags = donor.wizard.tags;
        mapping = autoMapTagsToColumns(tags, columns);
      }
      if (!templateName) {
        templateName = donor?.wizard.templateName || donorFile.name;
      }
    }
  }

  updateDocument(doc.id, {
    status: "draft",
    wizard: {
      step: templateName ? (tags.length ? 3 : 1) : 1,
      templateName,
      tags,
      columns,
      rows,
      mapping,
      dataFilename: "из ИУЛ",
      rowFrom: 1,
      rowTo: rows.length,
      lastGenerateNote: `Собрано из ${rows.length} ИУЛ`,
    },
  });

  const fresh = getDocument(doc.id);
  if (!fresh) throw new Error("Не удалось создать накладную");
  return fresh;
}

/** Найти в проекте накладную с уже загруженным шаблоном. */
export async function findWaybillTemplateDonor(
  projectId: string,
): Promise<string | null> {
  const { listDocuments } = await import("@/lib/docs-store");
  const docs = listDocuments(projectId).filter((d) => d.kind === "waybill");
  for (const d of docs) {
    if (d.wizard.templateName) {
      const file = await loadDocTemplate(d.id);
      if (file) return d.id;
    }
  }
  return null;
}
