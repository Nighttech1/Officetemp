/**
 * Selftest C-127: PDF ИУЛ — Times New Roman 10pt, bold как в Word.
 * Run: npx --yes tsx lib/iul-pdf.selftest.ts  (from frontend/)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildIulPdfBlob,
  IUL_PDF_FONT,
  setIulPdfFontsForTest,
} from "./iul-pdf";
import type { InfoSheetWizardState } from "./docs-store";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(__dirname, "..", "public", "fonts");
const ticketDir = join(
  __dirname,
  "..",
  "..",
  "memory",
  "tickets",
  "C-127-iul-pdf-times-bold",
);

function b64FromFile(name: string): string {
  return readFileSync(join(fontsDir, name)).toString("base64");
}

function wideSigDataUrl(): string {
  const legacy = join(
    __dirname,
    "..",
    "..",
    "memory",
    "tickets",
    "C-100-iul-pdf-layout-dates",
    "sig-wide.png",
  );
  const png = readFileSync(legacy);
  return `data:image/png;base64,${png.toString("base64")}`;
}

async function main() {
  setIulPdfFontsForTest({
    normal: b64FromFile("TimesNewRoman.ttf"),
    bold: b64FromFile("TimesNewRoman-Bold.ttf"),
  });

  const wizard: InfoSheetWizardState = {
    step: 3,
    sourceFileName: "чертёж-КЖ6.2.pdf",
    fileSizeBytes: 12345,
    fileModifiedAt: "2026-09-25T12:00:00",
    hashAlgo: "MD5",
    fileHash: "abc123",
    objectName: "Жилой дом Секция 2",
    docDesignation: "56-0321-ОК-1-2-КЖ6.2",
    docName: "Вертикальные несущие конструкции",
    docVersion: "2",
    ulCode: "56-0321-ОК-1-2-КЖ6.2_УЛ",
    sheetNo: "1",
    sheetsTotal: "1",
    signatureSource: "library",
    signatures: [
      {
        role: "Разработал",
        surname: "Иванов",
        signedAt: "2026-09-25",
        note: "",
        signatureImageDataUrl: wideSigDataUrl(),
      },
    ],
  };

  const blob = await buildIulPdfBlob(wizard);
  const buf = Buffer.from(await blob.arrayBuffer());
  if (buf.length < 5000) throw new Error(`PDF too small: ${buf.length}`);

  const asLatin = buf.toString("latin1");
  if (
    !asLatin.includes(IUL_PDF_FONT) &&
    !asLatin.includes("TimesNewRoman") &&
    !asLatin.includes("Times")
  ) {
    throw new Error("Times New Roman font not embedded in PDF");
  }

  mkdirSync(ticketDir, { recursive: true });
  const outPdf = join(ticketDir, "sample-iul-times.pdf");
  writeFileSync(outPdf, buf);
  console.log("iul-pdf selftest OK", buf.length, "bytes →", outPdf);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
