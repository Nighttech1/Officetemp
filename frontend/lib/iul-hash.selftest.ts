/**
 * Unit checks for IUL hash length (C-84 / C-86) + date input (C-107).
 * Run: npx --yes tsx lib/iul-hash.selftest.ts  (from frontend/)
 */
import {
  expectedHashHexLen,
  formatIulDisplayDate,
  hashFile,
  iulVersionCell,
  normalizeFileHash,
  toHtmlDateValue,
} from "./iul-hash";

async function main() {
  const sample = new TextEncoder().encode("docsaas-iul-hash-selftest").buffer;
  for (const algo of ["MD5", "SHA-1", "SHA-256", "CRC32"] as const) {
    const a = await hashFile(sample, algo);
    const b = await hashFile(sample, algo);
    const len = expectedHashHexLen(algo);
    if (a.length !== len) {
      throw new Error(`${algo}: expected len ${len}, got ${a.length} (${a})`);
    }
    if (a !== b) throw new Error(`${algo}: not stable`);
    const dup = normalizeFileHash(a + a, algo);
    if (dup !== a) {
      throw new Error(`${algo}: normalize failed on duplicated digest`);
    }
  }
  if (expectedHashHexLen("MD5") !== 32) {
    throw new Error("MD5 expected length must be 32");
  }
  if (formatIulDisplayDate("2026-09-11") !== "11.09.2026") {
    throw new Error("formatIulDisplayDate ISO failed");
  }
  if (formatIulDisplayDate("11-09-2026") !== "11.09.2026") {
    throw new Error("formatIulDisplayDate dash→dot failed");
  }
  if (formatIulDisplayDate("11.09.2026") !== "11.09.2026") {
    throw new Error("formatIulDisplayDate dotted failed");
  }
  if (toHtmlDateValue("23.09.2026") !== "2026-09-23") {
    throw new Error("toHtmlDateValue dotted failed");
  }
  if (toHtmlDateValue("2026-09-23 11:00") !== "2026-09-23") {
    throw new Error("toHtmlDateValue ISO+time failed");
  }
  if (iulVersionCell("") !== "-" || iulVersionCell("  ") !== "-") {
    throw new Error("iulVersionCell empty must be -");
  }
  if (iulVersionCell("1") !== "1") {
    throw new Error("iulVersionCell filled failed");
  }
  console.log("iul-hash selftest OK");
}

void main();
