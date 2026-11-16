/** Сборка и скачивание ZIP в браузере (пакет ИУЛ). */

import { zipSync, strToU8 } from "fflate";

export function buildZipBlob(
  files: { name: string; data: Uint8Array }[],
): Blob {
  const unique = new Map<string, Uint8Array>();
  for (const f of files) {
    let name = f.name.replace(/[\\/]+/g, "_");
    if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";
    let candidate = name;
    let n = 2;
    while (unique.has(candidate)) {
      const stem = name.replace(/\.pdf$/i, "");
      candidate = `${stem}_${n}.pdf`;
      n += 1;
    }
    unique.set(candidate, f.data);
  }
  const record: Record<string, Uint8Array> = {};
  for (const [k, v] of unique) record[k] = v;
  const zipped = zipSync(record, { level: 6 });
  return new Blob([zipped], { type: "application/zip" });
}

export function zipFilename(when = new Date()): string {
  const y = when.getFullYear();
  const m = String(when.getMonth() + 1).padStart(2, "0");
  const d = String(when.getDate()).padStart(2, "0");
  const hh = String(when.getHours()).padStart(2, "0");
  const mm = String(when.getMinutes()).padStart(2, "0");
  return `IULy_${y}-${m}-${d}_${hh}-${mm}.zip`;
}

/** Для тестов Node: собрать ZIP из буферов. */
export function buildZipUint8Array(
  files: { name: string; data: Uint8Array }[],
): Uint8Array {
  const record: Record<string, Uint8Array> = {};
  const used = new Set<string>();
  for (const f of files) {
    let name = f.name.replace(/[\\/]+/g, "_");
    if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";
    let candidate = name;
    let n = 2;
    while (used.has(candidate)) {
      candidate = `${name.replace(/\.pdf$/i, "")}_${n}.pdf`;
      n += 1;
    }
    used.add(candidate);
    record[candidate] = f.data;
  }
  return zipSync(record, { level: 6 });
}

export { strToU8 };
