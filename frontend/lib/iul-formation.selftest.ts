/**
 * Selftest: IUL formation rules C-89 / C-90.
 * Run: npx --yes tsx lib/iul-formation.selftest.ts  (from frontend/)
 */
import { applyProjectRoleSettings } from "./docs-store";
import {
  expectedHashHexLen,
  formatIulDisplayDate,
  hashFile,
  iulVersionCell,
  mergeIzmIntoDesignation,
  normalizeFileHash,
  normalizeIulVersion,
  applyFileModifiedDateToSignatures,
} from "./iul-hash";

async function hashOk() {
  const sample = new TextEncoder().encode("docsaas-iul-hash-selftest").buffer;
  for (const algo of ["MD5", "SHA-1", "SHA-256", "CRC32"] as const) {
    const a = await hashFile(sample, algo);
    const len = expectedHashHexLen(algo);
    if (a.length !== len) throw new Error(`${algo} len`);
    if (normalizeFileHash(a + a, algo) !== a) throw new Error(`${algo} norm`);
  }
}

function sigRules() {
  const settings = {
    fixedRoles: ["Разработал", "Проверил", "ГИП"],
    overflowRole: "Прочие",
    defaultHashAlgo: "MD5" as const,
  };
  const found = [
    { role: "Проверил", surname: "Иванов", signedAt: "2026-01-01", note: "" },
    { role: "Разработал", surname: "Петров", signedAt: "", note: "" },
    { role: "Разработал", surname: "Петров", signedAt: "x", note: "" }, // dup
    { role: "ГИП", surname: "Сидоров", signedAt: "", note: "" },
    { role: "Разработал", surname: "Сидоров", signedAt: "", note: "" }, // GIP exclusive
    { role: "Согласовано", surname: "Козлов", signedAt: "", note: "" },
    { role: "Н. контр.", surname: "Орлов", signedAt: "", note: "" },
  ];
  const settingsWithNormo = {
    fixedRoles: ["Разработал", "Проверил", "Нормоконтроль", "ГИП"],
    overflowRole: "Прочие",
    defaultHashAlgo: "MD5" as const,
  };
  const withNormo = applyProjectRoleSettings(found, settingsWithNormo);
  if (
    !withNormo.some(
      (s) => s.role === "Нормоконтроль" && s.surname === "Орлов",
    )
  ) {
    throw new Error("normocontrol alias → settings name failed");
  }
  const out = applyProjectRoleSettings(found, settings);
  const keys = out.map((s) => `${s.role}|${s.surname}`);
  // order: Разработал, Проверил, ГИП, then overflow
  if (out[0]?.role !== "Разработал") throw new Error("order 0");
  if (out[1]?.role !== "Проверил") throw new Error("order 1");
  if (out[2]?.role !== "ГИП") throw new Error("order 2");
  // no dup Петров×2
  if (keys.filter((k) => k === "Разработал|Петров").length !== 1) {
    throw new Error("dup Разработал|Петров");
  }
  // Сидоров only as ГИП
  if (out.some((s) => s.surname === "Сидоров" && s.role !== "ГИП")) {
    throw new Error("GIP exclusive failed");
  }
  if (!out.some((s) => s.role === "Прочие" && s.surname === "Козлов")) {
    throw new Error("overflow missing");
  }

  // C-105: кроме «Разработал» — только первая фамилия
  const multi = applyProjectRoleSettings(
    [
      { role: "Проверил", surname: "Первый", signedAt: "", note: "" },
      { role: "Проверил", surname: "Второй", signedAt: "", note: "" },
      { role: "Разработал", surname: "Альфа", signedAt: "", note: "" },
      { role: "Разработал", surname: "Бета", signedAt: "", note: "" },
      { role: "ГИП", surname: "Гамма", signedAt: "", note: "" },
      { role: "ГИП", surname: "Дельта", signedAt: "", note: "" },
    ],
    settings,
  );
  const checked = multi.filter((s) => s.role === "Проверил");
  if (checked.length !== 1 || checked[0]?.surname !== "Первый") {
    throw new Error("C-105 Проверил must keep first only: " + JSON.stringify(checked));
  }
  const raz = multi.filter((s) => s.role === "Разработал");
  if (raz.length !== 2) {
    throw new Error("C-105 Разработал must keep all: " + JSON.stringify(raz));
  }
  const gips = multi.filter((s) => s.role === "ГИП");
  if (gips.length !== 1 || gips[0]?.surname !== "Гамма") {
    throw new Error("C-105 ГИП first only: " + JSON.stringify(gips));
  }
}

function canonicalSigRules() {
  // Без fixedRoles → константный список: Разработал, Проверил, Н. Контр., ГИП.
  // Прочие характеры → «Разработал»; Н. Контр. и ГИП — по одному; Проверил — все.
  const found = [
    { role: "ГИП", surname: "Гипов", signedAt: "", note: "" },
    { role: "Нормоконтроль", surname: "Нормов", signedAt: "", note: "" },
    { role: "Проверил", surname: "Первый", signedAt: "", note: "" },
    { role: "Проверил", surname: "Второй", signedAt: "", note: "" },
    { role: "Разработал", surname: "Альфа", signedAt: "", note: "" },
    { role: "Согласовано", surname: "Бета", signedAt: "", note: "" }, // прочий → Разработал
    { role: "Н. контр.", surname: "Нормов2", signedAt: "", note: "" }, // 2-й нормоконтроль
    { role: "ГИП", surname: "Гипов2", signedAt: "", note: "" }, // 2-й ГИП
  ];
  const out = applyProjectRoleSettings(found, undefined);
  const roles = out.map((s) => s.role);

  // Все роли — строго из константного списка и в строгом порядке
  const order = ["Разработал", "Проверил", "Н. Контр.", "ГИП"];
  let last = -1;
  for (const s of out) {
    const pos = order.indexOf(s.role);
    if (pos === -1) {
      throw new Error("canon: роль вне константного списка: " + s.role);
    }
    if (pos < last) {
      throw new Error("canon: нарушен порядок: " + JSON.stringify(roles));
    }
    last = pos;
  }
  // Прочий характер «Согласовано» (Бета) ушёл в «Разработал»
  if (!out.some((s) => s.role === "Разработал" && s.surname === "Бета")) {
    throw new Error("canon: прочий характер не стал Разработал");
  }
  // Разработал и Проверил — сохраняют всех
  if (out.filter((s) => s.role === "Разработал").length !== 2) {
    throw new Error("canon: Разработал должен сохранить всех");
  }
  if (out.filter((s) => s.role === "Проверил").length !== 2) {
    throw new Error("canon: Проверил должен сохранить всех");
  }
  // Н. Контр. (нормоконтроль-синонимы пойманы) — 1 человек (первый)
  const nk = out.filter((s) => s.role === "Н. Контр.");
  if (nk.length !== 1 || nk[0]?.surname !== "Нормов") {
    throw new Error("canon: Н. Контр. должен быть 1 (первый): " + JSON.stringify(nk));
  }
  // ГИП — 1 человек (первый)
  const gip = out.filter((s) => s.role === "ГИП");
  if (gip.length !== 1 || gip[0]?.surname !== "Гипов") {
    throw new Error("canon: ГИП должен быть 1 (первый): " + JSON.stringify(gip));
  }

  // Один человек под несколькими «прочими» характерами → одна строка «Разработал»
  const dupFound = [
    { role: "Разработал", surname: "Сажина", signedAt: "", note: "" },
    { role: "Согласовано", surname: "Романов", signedAt: "", note: "" },
    { role: "Изм. внес", surname: "Романов", signedAt: "", note: "" },
    { role: "Составил", surname: "Романов", signedAt: "", note: "" },
  ];
  const dupOut = applyProjectRoleSettings(dupFound, undefined);
  const raz = dupOut.filter(
    (s) => s.role === "Разработал" && s.surname === "Романов",
  );
  if (raz.length !== 1) {
    throw new Error(
      "canon: дубль «прочих» характеров не схлопнут в одну строку: " +
        JSON.stringify(dupOut),
    );
  }
  if (!dupOut.some((s) => s.role === "Разработал" && s.surname === "Сажина")) {
    throw new Error("canon: Разработал/Сажина потерян при дедупе");
  }
}

function versionRules() {
  if (iulVersionCell("") !== "-" || iulVersionCell("0") !== "-") {
    throw new Error("iulVersionCell 0/empty");
  }
  if (normalizeIulVersion("0") !== "") throw new Error("normalize 0");
  if (normalizeIulVersion("Изм.2") !== "2") throw new Error("normalize izm→2");
  if (normalizeIulVersion("2") !== "2") throw new Error("normalize plain 2");
  const m = mergeIzmIntoDesignation("56-01-А", "Изм.2");
  if (!m.designation.includes("Изм. 2") || m.version !== "2") {
    throw new Error("mergeIzm failed: " + JSON.stringify(m));
  }
  if (formatIulDisplayDate("2026-09-11") !== "11.09.2026") {
    throw new Error("date format");
  }
  const synced = applyFileModifiedDateToSignatures(
    [
      { signedAt: "2020-01-01" },
      { signedAt: "05-06-2026" },
    ],
    "23.09.2026 11:42:37",
  );
  if (synced.some((s) => s.signedAt !== "2026-09-23")) {
    throw new Error("C-95 unified sign dates failed");
  }
}

async function main() {
  await hashOk();
  sigRules();
  canonicalSigRules();
  versionRules();
  console.log("iul-formation selftest OK");
}

void main();
