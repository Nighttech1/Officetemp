/** Клиентский расчёт хэша файла для ИУЛ (файл никуда не отправляется). */

import type { InfoSheetHashAlgo } from "@/lib/docs-store";

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** CRC32 (полином 0xEDB88320), результат — 8 hex-символов. */
export function crc32Hex(data: ArrayBuffer): string {
  const buf = new Uint8Array(data);
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0");
}

/** Минимальный MD5 (RFC 1321) → hex lowercase. */
export function md5Hex(data: ArrayBuffer): string {
  const msg = new Uint8Array(data);
  const n = msg.length;
  const bitLen = n * 8;
  const withOne = n + 1;
  const padLen = (withOne % 64 <= 56 ? 56 : 120) - (withOne % 64);
  const total = withOne + padLen + 8;
  const bytes = new Uint8Array(total);
  bytes.set(msg);
  bytes[n] = 0x80;
  const view = new DataView(bytes.buffer);
  view.setUint32(total - 8, bitLen >>> 0, true);
  view.setUint32(total - 4, Math.floor(bitLen / 0x100000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
    9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
    16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
    15, 21,
  ];
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
  }

  const rotl = (x: number, c: number) => (x << c) | (x >>> (32 - c));

  for (let offset = 0; offset < total; offset += 64) {
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i++) {
      M[i] = view.getUint32(offset + i * 4, true);
    }
    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotl(F, s[i])) >>> 0;
    }
    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const ov = new DataView(out.buffer);
  ov.setUint32(0, a0, true);
  ov.setUint32(4, b0, true);
  ov.setUint32(8, c0, true);
  ov.setUint32(12, d0, true);
  return toHex(out);
}

export async function hashFile(
  data: ArrayBuffer,
  algo: InfoSheetHashAlgo,
): Promise<string> {
  // Independent copy: subtle.digest must not detach/alias the caller's buffer.
  const copy = data.slice(0);
  let hex: string;
  if (algo === "CRC32") hex = crc32Hex(copy);
  else if (algo === "MD5") hex = md5Hex(copy);
  else {
    const name = algo === "SHA-1" ? "SHA-1" : "SHA-256";
    const digest = await crypto.subtle.digest(name, copy);
    hex = toHex(digest);
  }
  return normalizeFileHash(hex, algo);
}

/** Ожидаемая длина hex-строки хэша. */
export function expectedHashHexLen(algo: InfoSheetHashAlgo): number {
  switch (algo) {
    case "CRC32":
      return 8;
    case "MD5":
      return 32;
    case "SHA-1":
      return 40;
    case "SHA-256":
      return 64;
    default:
      return 64;
  }
}

/**
 * Нормализация хэша: только hex, нижний регистр.
 * Если по ошибке склеили два одинаковых дайджеста — оставляем один.
 */
export function normalizeFileHash(
  hex: string,
  algo: InfoSheetHashAlgo,
): string {
  const clean = String(hex || "")
    .trim()
    .toLowerCase()
    .replace(/[^0-9a-f]/g, "");
  const len = expectedHashHexLen(algo);
  if (clean.length === len * 2 && clean.slice(0, len) === clean.slice(len)) {
    return clean.slice(0, len);
  }
  if (clean.length > len) return clean.slice(0, len);
  return clean;
}

/** Хэш File/Blob одним проходом (для seed и applyFile). */
export async function hashBlob(
  file: Blob,
  algo: InfoSheetHashAlgo,
): Promise<string> {
  const ab = await file.arrayBuffer();
  return hashFile(ab, algo);
}

/** Дата изменения файла: ДД.ММ.ГГГГ ЧЧ:ММ:СС */
export function formatFileModifiedAt(file: File): string {
  const d = new Date(file.lastModified);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Дата для бланка ИУЛ: ДД.ММ.ГГГГ.
 * Понимает ISO YYYY-MM-DD, ДД.ММ.ГГГГ и старый ДД-ММ-ГГГГ.
 */
export function formatIulDisplayDate(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  const dash = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (dash) return `${dash[1]}.${dash[2]}.${dash[3]}`;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
  const dotted = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (dotted) {
    let y = dotted[3];
    if (y.length === 2) y = `20${y}`;
    return `${dotted[1].padStart(2, "0")}.${dotted[2].padStart(2, "0")}.${y}`;
  }
  return s;
}

/**
 * Значение для `<input type="date">` — строго YYYY-MM-DD.
 * Принимает ISO, дд.мм.гггг, дд-мм-гггг и дату со временем.
 */
export function toHtmlDateValue(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dash = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (dash) return `${dash[3]}-${dash[2]}-${dash[1]}`;
  const dotted = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (dotted) {
    let y = dotted[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${dotted[2].padStart(2, "0")}-${dotted[1].padStart(2, "0")}`;
  }
  return "";
}

/** Дата подписи = дата изменения файла ИУЛ (ISO YYYY-MM-DD для поля формы). */
export function iulSignDateFromFileModified(fileModifiedAt: string): string {
  return toHtmlDateValue(fileModifiedAt);
}

/** Проставить одну дату изменения ИУЛ всем подписантам (хранение YYYY-MM-DD). */
export function applyFileModifiedDateToSignatures<
  T extends { signedAt: string },
>(signatures: T[], fileModifiedAt: string): T[] {
  const d = iulSignDateFromFileModified(fileModifiedAt);
  if (!d || !signatures.length) return signatures;
  return signatures.map((s) => ({ ...s, signedAt: d }));
}

/**
 * Дата+время изменения файла для бланка/формы.
 * `2026-09-23 11:42:37` → `23.09.2026 11:42:37`
 */
export function formatFileModifiedDisplay(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  const dash = s.match(/^(\d{2})-(\d{2})-(\d{4})(.*)$/);
  if (dash) {
    const rest = (dash[4] || "").trim();
    const date = `${dash[1]}.${dash[2]}.${dash[3]}`;
    return rest ? `${date} ${rest}` : date;
  }
  const dotted = s.match(/^(\d{2})\.(\d{2})\.(\d{4})(.*)$/);
  if (dotted) {
    const rest = (dotted[4] || "").trim();
    const date = `${dotted[1]}.${dotted[2]}.${dotted[3]}`;
    return rest ? `${date} ${rest}` : date;
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
  if (iso) {
    const rest = (iso[4] || "").trim().replace(/^T/, "");
    const date = `${iso[3]}.${iso[2]}.${iso[1]}`;
    return rest ? `${date} ${rest}` : date;
  }
  return s;
}

/** Версия в бланке: пусто или «0» → "-" */
export function iulVersionCell(version: string | null | undefined): string {
  const v = String(version ?? "").trim();
  if (!v || v === "0") return "-";
  return v;
}

/**
 * Нормализация версии для ячейки ИУЛ.
 * «Изм. 2» / «Изменение 2» → «2»; чистое число оставляем; «0» → пусто.
 */
export function normalizeIulVersion(version: string | null | undefined): string {
  const v = String(version ?? "").trim();
  if (!v || v === "0") return "";
  if (/^\d{1,3}$/.test(v)) return v;
  const m = v.match(/изм(?:енение)?\.?\s*(\d{1,3})/i);
  if (m) return m[1];
  return v;
}

/**
 * Если версия выглядит как «Изм. N» — дописать к обозначению при необходимости,
 * в ячейку версии оставить только номер N.
 */
export function mergeIzmIntoDesignation(
  designation: string,
  version: string,
): { designation: string; version: string } {
  const des = String(designation || "").trim();
  const ver = String(version || "").trim();
  const m = ver.match(/изм(?:енение)?\.?\s*(\d+)/i);
  if (!m) {
    return { designation: des, version: normalizeIulVersion(ver) };
  }
  const num = m[1];
  const suffix = ` (Изм. ${num})`;
  const has =
    des.includes(`Изм. ${num}`) ||
    des.includes(`Изм.${num}`) ||
    des.includes(`(Изм. ${num})`) ||
    des.includes(`(изм. ${num})`);
  return {
    designation: has || !des ? des : `${des}${suffix}`,
    version: num,
  };
}
