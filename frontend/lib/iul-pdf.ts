/** Сборка PDF информационно-удостоверительного листа (A4).
 * Геометрия колонок/строк — как в `templates/ИУЛ template.docx`.
 */

import { jsPDF } from "jspdf";
import type { InfoSheetWizardState } from "@/lib/docs-store";
import {
  formatFileModifiedDisplay,
  formatIulDisplayDate,
  iulVersionCell,
} from "@/lib/iul-hash";

/** Как в `templates/ИУЛ template.docx` (Helvetica в jsPDF кириллицу не умеет). */
export const IUL_PDF_FONT = "TimesNewRoman";
/** Кегль ячеек как в Word (10 pt). */
export const IUL_PDF_FONT_SIZE = 10;

type FontCache = { normal: string; bold: string };
let fontCache: FontCache | null = null;
let fontLoad: Promise<FontCache> | null = null;

/** Поля из Word-шаблона (dxa→mm), суммарная ширина сетки ≈ 186 mm. */
const PAGE_W = 210;
const MARGIN_X = 12;
const USABLE = PAGE_W - MARGIN_X * 2; // 186

/** table0: № | обозначение | наименование | версия
 *  C-205: ширины из обновлённого `templates/ИУЛ template.docx`
 *  (gridCol dxa 1003/2977/4836/1729 → mm ≈ 17.69/52.51/85.30/30.50).
 */
const C0 = [
  (17.69 / 186) * USABLE,
  (52.51 / 186) * USABLE,
  (85.3 / 186) * USABLE,
  (30.5 / 186) * USABLE,
] as const;

/** table1: характер | фамилия | подпись | дата */
const C1 = [
  (48.37 / 186.02) * USABLE,
  (40.92 / 186.02) * USABLE,
  (55.81 / 186.02) * USABLE,
  (40.92 / 186.02) * USABLE,
] as const;

/** table2: штамп футера */
const C2 = [
  (47.98 / 186.04) * USABLE,
  (97.53 / 186.04) * USABLE,
  (20.0 / 186.04) * USABLE,
  (20.53 / 186.04) * USABLE,
] as const;

const H = {
  object: 17.92,
  docHead: 17.02,
  docData: 9.88,
  hash: 10.32,
  fileHead: 9.88,
  fileData: 9.88,
  sigHead: 9.88,
  sigRow: 19.72,
  footHalf: 6.93,
} as const;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function fetchFontBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Не удалось загрузить шрифт ИУЛ (${url}): ${res.status}`);
  }
  return arrayBufferToBase64(await res.arrayBuffer());
}

/** Загрузить Times New Roman TTF (кэш на модуле). */
export async function loadIulPdfFonts(): Promise<FontCache> {
  if (fontCache) return fontCache;
  if (!fontLoad) {
    fontLoad = Promise.all([
      fetchFontBase64("/fonts/TimesNewRoman.ttf"),
      fetchFontBase64("/fonts/TimesNewRoman-Bold.ttf"),
    ])
      .then(([normal, bold]) => {
        fontCache = { normal, bold };
        return fontCache;
      })
      .catch((err) => {
        fontLoad = null;
        throw err;
      });
  }
  return fontLoad;
}

/** Подставить base64 шрифтов (для selftest / Node без fetch). */
export function setIulPdfFontsForTest(fonts: FontCache): void {
  fontCache = fonts;
  fontLoad = Promise.resolve(fonts);
}

function registerFonts(doc: jsPDF, fonts: FontCache): void {
  doc.addFileToVFS("TimesNewRoman.ttf", fonts.normal);
  doc.addFont("TimesNewRoman.ttf", IUL_PDF_FONT, "normal");
  doc.addFileToVFS("TimesNewRoman-Bold.ttf", fonts.bold);
  doc.addFont("TimesNewRoman-Bold.ttf", IUL_PDF_FONT, "bold");
}

function setIulFont(doc: jsPDF, style: "normal" | "bold" = "normal"): void {
  doc.setFont(IUL_PDF_FONT, style);
}

function safeBasename(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").trim() || "document";
  return base.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 120);
}

export function iulPdfFilename(
  wizard: InfoSheetWizardState,
  when = new Date(),
): string {
  const y = when.getFullYear();
  const m = String(when.getMonth() + 1).padStart(2, "0");
  const d = String(when.getDate()).padStart(2, "0");
  const stem = safeBasename(
    wizard.sourceFileName || wizard.docDesignation || "ИУЛ",
  );
  return `${stem}_УЛ_${y}-${m}-${d}.pdf`;
}

function drawCenteredText(
  doc: jsPDF,
  lines: string | string[],
  cellX: number,
  cellW: number,
  textY: number,
): void {
  const midX = cellX + cellW / 2;
  doc.text(lines, midX, textY, { align: "center" });
}

function fitImageInBox(
  imgWpx: number,
  imgHpx: number,
  maxWmm: number,
  maxHmm: number,
): { w: number; h: number } {
  if (imgWpx <= 0 || imgHpx <= 0) {
    return { w: Math.min(maxWmm, 20), h: Math.min(maxHmm, 10) };
  }
  const aspect = imgWpx / imgHpx;
  let h = Math.min(maxHmm, 16);
  let w = h * aspect;
  if (w > maxWmm) {
    w = maxWmm;
    h = w / aspect;
  }
  return { w, h };
}

/**
 * Подобрать кегль так, чтобы перенесённый по ширине текст поместился по высоте
 * ячейки (иначе длинные значения — имя файла, наименование — вылезают за поля
 * в PDF, т.к. высота ячеек фиксирована, в отличие от HTML-превью).
 * Шрифт (семейство/начертание) должен быть установлен заранее.
 */
function fitTextToCell(
  doc: jsPDF,
  text: string,
  w: number,
  h: number,
  maxFs: number,
  minFs = 5.5,
): { lines: string[]; fs: number; lineH: number } {
  const content = text || " ";
  const innerW = Math.max(w - 2.5, 6);
  for (let fs = maxFs; fs > minFs; fs -= 0.5) {
    doc.setFontSize(fs);
    const lineH = fs * 0.42 + 1.2;
    const lines = doc.splitTextToSize(content, innerW) as string[];
    if (lines.length * lineH <= h - 0.8) {
      return { lines, fs, lineH };
    }
  }
  doc.setFontSize(minFs);
  const lineH = minFs * 0.42 + 1.2;
  const lines = doc.splitTextToSize(content, innerW) as string[];
  return { lines, fs: minFs, lineH };
}

/** Ячейка фиксированной высоты: рамка + текст по центру (кегль ужимается под высоту). */
function paintCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  opts?: { bold?: boolean; fontSize?: number },
): void {
  doc.rect(x, y, w, h);
  setIulFont(doc, opts?.bold ? "bold" : "normal");
  const maxFs = opts?.fontSize ?? IUL_PDF_FONT_SIZE;
  const { lines, fs, lineH } = fitTextToCell(doc, text, w, h, maxFs);
  doc.setFontSize(fs);
  const blockH = lines.length * lineH;
  const textY = y + (h - blockH) / 2 + lineH * 0.78;
  drawCenteredText(doc, lines, x, w, textY);
}

function footerStampLabel(wizard: InfoSheetWizardState): string {
  const ver = iulVersionCell(wizard.docVersion);
  const verBit = ver !== "-" ? ` Изм.${ver}` : "";
  const des = (wizard.docDesignation || "")
    .replace(/\s*\(?\s*Изм\.?\s*\d+\s*\)?/gi, "")
    .trim();
  const name = (wizard.docName || "").trim();
  const parts = [des, name].filter(Boolean).join(" ");
  if (parts) return `${parts}${verBit}_УЛ`;
  return wizard.ulCode || "—_УЛ";
}

export async function buildIulPdfBlob(
  wizard: InfoSheetWizardState,
): Promise<Blob> {
  const fonts = await loadIulPdfFonts();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registerFonts(doc, fonts);

  const x0 = MARGIN_X;
  let y = 8;

  // ——— table0: объект + документ + хэш + файл (одна сетка C0) ———
  // row0: объект (2+2) — в Word: Times 10, regular (не bold)
  paintCell(doc, x0, y, C0[0] + C0[1], H.object, "Наименование объекта", {
    bold: false,
    fontSize: IUL_PDF_FONT_SIZE,
  });
  paintCell(
    doc,
    x0 + C0[0] + C0[1],
    y,
    C0[2] + C0[3],
    H.object,
    wizard.objectName || "-",
    { bold: false, fontSize: IUL_PDF_FONT_SIZE },
  );
  y += H.object;

  // row1: заголовки документа — bold
  const docHeads = [
    "№ п/п",
    "Обозначение документа",
    "Наименование документа",
    "Номер последнего изменения (версии)",
  ];
  let cx = x0;
  for (let i = 0; i < 4; i++) {
    paintCell(doc, cx, y, C0[i], H.docHead, docHeads[i], {
      bold: true,
      fontSize: IUL_PDF_FONT_SIZE,
    });
    cx += C0[i];
  }
  y += H.docHead;

  // row2: данные документа — regular
  const docVals = [
    "1",
    wizard.docDesignation || "-",
    wizard.docName || "-",
    iulVersionCell(wizard.docVersion),
  ];
  cx = x0;
  for (let i = 0; i < 4; i++) {
    paintCell(doc, cx, y, C0[i], H.docData, docVals[i], {
      bold: false,
      fontSize: IUL_PDF_FONT_SIZE,
    });
    cx += C0[i];
  }
  y += H.docData;

  // row3: алгоритм хэша (hashAlgo) bold | hash regular | пустая
  const algo = (wizard.hashAlgo || "MD5").toUpperCase();
  paintCell(doc, x0, y, C0[0], H.hash, algo, {
    bold: true,
    fontSize: IUL_PDF_FONT_SIZE,
  });
  paintCell(
    doc,
    x0 + C0[0],
    y,
    C0[1] + C0[2],
    H.hash,
    wizard.fileHash || "-",
    { bold: false, fontSize: IUL_PDF_FONT_SIZE },
  );
  paintCell(doc, x0 + C0[0] + C0[1] + C0[2], y, C0[3], H.hash, " ", {
    bold: false,
    fontSize: IUL_PDF_FONT_SIZE,
  });
  y += H.hash;

  // row4–5: файл — заголовки bold, значения regular
  const fileHeads = [
    "Наименование файла",
    "Дата и время последнего изменения файла",
    "Размер, байт",
  ];
  paintCell(doc, x0, y, C0[0] + C0[1], H.fileHead, fileHeads[0], {
    bold: true,
    fontSize: IUL_PDF_FONT_SIZE,
  });
  paintCell(doc, x0 + C0[0] + C0[1], y, C0[2], H.fileHead, fileHeads[1], {
    bold: true,
    fontSize: IUL_PDF_FONT_SIZE,
  });
  paintCell(
    doc,
    x0 + C0[0] + C0[1] + C0[2],
    y,
    C0[3],
    H.fileHead,
    fileHeads[2],
    { bold: true, fontSize: IUL_PDF_FONT_SIZE },
  );
  y += H.fileHead;

  paintCell(
    doc,
    x0,
    y,
    C0[0] + C0[1],
    H.fileData,
    wizard.sourceFileName || "-",
    { bold: false, fontSize: IUL_PDF_FONT_SIZE },
  );
  paintCell(
    doc,
    x0 + C0[0] + C0[1],
    y,
    C0[2],
    H.fileData,
    formatFileModifiedDisplay(wizard.fileModifiedAt) || "-",
    { bold: false, fontSize: IUL_PDF_FONT_SIZE },
  );
  paintCell(
    doc,
    x0 + C0[0] + C0[1] + C0[2],
    y,
    C0[3],
    H.fileData,
    wizard.fileSizeBytes != null ? String(wizard.fileSizeBytes) : "-",
    { bold: false, fontSize: IUL_PDF_FONT_SIZE },
  );
  y += H.fileData + 2;

  // ——— table1: подписи ———
  const sigHeads = [
    "Характер работы",
    "Фамилия",
    "Подпись",
    "Дата подписания",
  ];
  cx = x0;
  for (let i = 0; i < 4; i++) {
    paintCell(doc, cx, y, C1[i], H.sigHead, sigHeads[i], {
      bold: true,
      fontSize: IUL_PDF_FONT_SIZE,
    });
    cx += C1[i];
  }
  y += H.sigHead;

  const sigs =
    wizard.signatures.length > 0
      ? wizard.signatures
      : [{ role: "-", surname: "-", signedAt: "-", note: "" }];

  for (const s of sigs) {
    const rowH = H.sigRow;
    const signDate = formatIulDisplayDate(s.signedAt) || "-";
    const texts = [s.role || "-", s.surname || "-", s.note || " ", signDate];

    let drawW = 0;
    let drawH = 0;
    let imgFmt: "PNG" | "JPEG" = "PNG";
    if (s.signatureImageDataUrl) {
      try {
        imgFmt = s.signatureImageDataUrl.includes("image/png")
          ? "PNG"
          : "JPEG";
        const props = doc.getImageProperties(s.signatureImageDataUrl);
        const fitted = fitImageInBox(
          props.width,
          props.height,
          C1[2] - 4,
          rowH - 3,
        );
        drawW = fitted.w;
        drawH = fitted.h;
      } catch {
        drawW = 0;
        drawH = 0;
      }
    }

    cx = x0;
    for (let i = 0; i < 4; i++) {
      doc.rect(cx, y, C1[i], rowH);
      if (i === 2 && s.signatureImageDataUrl && drawW > 0 && drawH > 0) {
        try {
          const ix = cx + (C1[i] - drawW) / 2;
          const iy = y + (rowH - drawH) / 2;
          doc.addImage(
            s.signatureImageDataUrl,
            imgFmt,
            ix,
            iy,
            drawW,
            drawH,
          );
        } catch {
          paintCell(doc, cx, y, C1[i], rowH, texts[i], {
            fontSize: IUL_PDF_FONT_SIZE,
          });
        }
      } else if (i !== 2 || !s.signatureImageDataUrl) {
        setIulFont(doc, "normal");
        const { lines, fs, lineH } = fitTextToCell(
          doc,
          texts[i],
          C1[i],
          rowH,
          IUL_PDF_FONT_SIZE,
        );
        doc.setFontSize(fs);
        const blockH = lines.length * lineH;
        const textY = y + (rowH - blockH) / 2 + lineH * 0.78;
        drawCenteredText(doc, lines, cx, C1[i], textY);
      }
      cx += C1[i];
    }
    y += rowH;
  }
  y += 3;

  // ——— table2: футер-штамп (две половины по высоте для Лист/Листов) ———
  const footH = H.footHalf * 2;
  const footLabel = "Информационно-удостоверяющий лист";
  const footMid = footerStampLabel(wizard);
  const sheetNo = wizard.sheetNo || "1";
  const sheetsTotal = wizard.sheetsTotal || "1";

  // левые две ячейки на всю высоту — в Word regular
  paintCell(doc, x0, y, C2[0], footH, footLabel, {
    bold: false,
    fontSize: IUL_PDF_FONT_SIZE,
  });
  paintCell(doc, x0 + C2[0], y, C2[1], footH, footMid, {
    bold: false,
    fontSize: IUL_PDF_FONT_SIZE,
  });
  // Лист / значение — в Word regular (не bold)
  paintCell(doc, x0 + C2[0] + C2[1], y, C2[2], H.footHalf, "Лист", {
    bold: false,
    fontSize: IUL_PDF_FONT_SIZE,
  });
  paintCell(
    doc,
    x0 + C2[0] + C2[1],
    y + H.footHalf,
    C2[2],
    H.footHalf,
    sheetNo,
    { bold: false, fontSize: IUL_PDF_FONT_SIZE },
  );
  // Листов / значение
  paintCell(
    doc,
    x0 + C2[0] + C2[1] + C2[2],
    y,
    C2[3],
    H.footHalf,
    "Листов",
    { bold: false, fontSize: IUL_PDF_FONT_SIZE },
  );
  paintCell(
    doc,
    x0 + C2[0] + C2[1] + C2[2],
    y + H.footHalf,
    C2[3],
    H.footHalf,
    sheetsTotal,
    { bold: false, fontSize: IUL_PDF_FONT_SIZE },
  );

  return doc.output("blob");
}
