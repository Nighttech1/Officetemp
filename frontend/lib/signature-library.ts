/**
 * Глобальная библиотека подписей: одна на всё приложение, не зависит от
 * аккаунта/логина и от проекта. Фамилия → картинка + папки.
 *
 * localStorage здесь — кэш; источник правды — сервер (`/signatures/library`),
 * пуш правок делает lib/signature-sync. Параметр `projectId` в функциях
 * сохранён ради совместимости вызовов, но игнорируется (библиотека плоская).
 */

const STORE_KEY = "docsaas_sign_lib_global_v1";
// Прежние (пер-проектные) ключи — мигрируем один раз в плоский глобальный стор.
const LEGACY_KEY_V3 = "docsaas_sign_lib_v3";
const LEGACY_KEY_V2 = "docsaas_sign_lib_v2";

export type SignatureFolder = {
  id: string;
  parentId: string | null;
  name: string;
  createdAt: string;
};

export type SignatureLibEntry = {
  id: string;
  /** Папка внутри библиотеки; null — корень. */
  folderId: string | null;
  surname: string;
  /** data:image/...;base64,... */
  imageDataUrl: string;
  createdAt: string;
};

type Store = {
  folders: SignatureFolder[];
  entries: SignatureLibEntry[];
};

type LegacyFolder = SignatureFolder & { projectId?: string };
type LegacyEntry = SignatureLibEntry & { projectId?: string };

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function normSurname(s: string): string {
  return s.trim().toLowerCase().replace(/ё/g, "е");
}

function emptyStore(): Store {
  return { folders: [], entries: [] };
}

/** Снять projectId со старых пер-проектных записей → плоский глобальный стор. */
function migrateFromLegacy(): Store {
  if (typeof window === "undefined") return emptyStore();
  try {
    const rawV3 = localStorage.getItem(LEGACY_KEY_V3);
    if (rawV3) {
      const parsed = JSON.parse(rawV3) as {
        folders?: LegacyFolder[];
        entries?: LegacyEntry[];
      };
      return {
        folders: Array.isArray(parsed.folders)
          ? parsed.folders.map((f) => ({
              id: f.id,
              parentId: f.parentId ?? null,
              name: f.name,
              createdAt: f.createdAt,
            }))
          : [],
        entries: Array.isArray(parsed.entries)
          ? parsed.entries.map((e) => ({
              id: e.id,
              folderId: e.folderId ?? null,
              surname: e.surname,
              imageDataUrl: e.imageDataUrl,
              createdAt: e.createdAt,
            }))
          : [],
      };
    }
    const rawV2 = localStorage.getItem(LEGACY_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as
        | LegacyEntry[]
        | { entries?: LegacyEntry[] };
      const entriesRaw = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.entries)
          ? parsed.entries
          : [];
      return {
        folders: [],
        entries: entriesRaw.map((e) => ({
          id: e.id,
          folderId: e.folderId ?? null,
          surname: e.surname,
          imageDataUrl: e.imageDataUrl,
          createdAt: e.createdAt,
        })),
      };
    }
  } catch {
    /* ignore */
  }
  return emptyStore();
}

function loadStore(): Store {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const migrated = migrateFromLegacy();
      if (migrated.entries.length || migrated.folders.length) {
        saveStore(migrated);
      }
      return migrated;
    }
    const parsed = JSON.parse(raw) as Store;
    return {
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      entries: Array.isArray(parsed.entries)
        ? parsed.entries.map((e) => ({ ...e, folderId: e.folderId ?? null }))
        : [],
    };
  } catch {
    return emptyStore();
  }
}

/**
 * @param push — слать ли правку на сервер (по умолчанию да). Серверный pull
 * вызывает replaceSignatureLibrary с push=false, чтобы не было эха.
 */
function saveStore(store: Store, push = true): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
  if (push) {
    void import("@/lib/signature-sync").then((m) => m.scheduleSignaturePush());
  }
}

/** Полный дамп для cloud sync. */
export function dumpSignatureLibrary(): Store {
  return loadStore();
}

/** Заменить локальную библиотеку снимком с сервера (без обратного пуша). */
export function replaceSignatureLibrary(next: Store): void {
  saveStore(
    {
      folders: Array.isArray(next.folders) ? next.folders : [],
      entries: Array.isArray(next.entries)
        ? next.entries.map((e) => ({ ...e, folderId: e.folderId ?? null }))
        : [],
    },
    false,
  );
}

export function listSignFolders(_projectId?: string): SignatureFolder[] {
  return loadStore().folders.sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export function listSignFoldersIn(
  projectId: string,
  parentId: string | null,
): SignatureFolder[] {
  return listSignFolders(projectId).filter(
    (f) => (f.parentId ?? null) === (parentId ?? null),
  );
}

export function createSignFolder(
  _projectId: string,
  name: string,
  parentId: string | null = null,
): SignatureFolder {
  const store = loadStore();
  if (parentId) {
    const parent = store.folders.find((f) => f.id === parentId);
    if (!parent) {
      throw new Error("Родительская папка не найдена");
    }
  }
  const folder: SignatureFolder = {
    id: uid("sfld"),
    parentId,
    name: name.trim() || "Новая папка",
    createdAt: new Date().toISOString(),
  };
  store.folders.push(folder);
  saveStore(store);
  return folder;
}

export function deleteSignFolder(folderId: string): boolean {
  const store = loadStore();
  const folder = store.folders.find((f) => f.id === folderId);
  if (!folder) return false;
  const toRemove = new Set<string>();
  function collect(id: string) {
    toRemove.add(id);
    for (const f of store.folders) {
      if (f.parentId === id) collect(f.id);
    }
  }
  collect(folderId);
  store.folders = store.folders.filter((f) => !toRemove.has(f.id));
  store.entries = store.entries.filter(
    (e) => !e.folderId || !toRemove.has(e.folderId),
  );
  saveStore(store);
  return true;
}

export function folderPathLabel(
  _projectId: string,
  folderId: string | null,
): string {
  if (!folderId) return "Корень";
  const folders = loadStore().folders;
  const parts: string[] = [];
  let cur: string | null = folderId;
  const guard = new Set<string>();
  while (cur && !guard.has(cur)) {
    guard.add(cur);
    const f = folders.find((x) => x.id === cur);
    if (!f) break;
    parts.unshift(f.name);
    cur = f.parentId;
  }
  return parts.join(" / ") || "Корень";
}

export function listSignatureLibrary(_projectId?: string): SignatureLibEntry[] {
  return loadStore().entries;
}

export function listSignaturesInFolder(
  projectId: string,
  folderId: string | null,
): SignatureLibEntry[] {
  return listSignatureLibrary(projectId)
    .filter((e) => (e.folderId ?? null) === (folderId ?? null))
    .sort((a, b) => a.surname.localeCompare(b.surname, "ru"));
}

export function findSignatureImage(
  _projectId: string,
  surname: string,
): string | undefined {
  const key = normSurname(surname);
  if (!key) return undefined;
  const hit = loadStore().entries.find((e) => normSurname(e.surname) === key);
  return hit?.imageDataUrl;
}

/**
 * Индекс «нормализованная фамилия → картинка подписи» (один проход по стору).
 * Используется для восстановления картинок в документах, где их намеренно
 * не храним (чтобы не раздувать docsaas_docs_v1 и не упираться в квоту).
 */
export function signatureImageIndex(): Map<string, string> {
  const map = new Map<string, string>();
  for (const e of loadStore().entries) {
    const key = normSurname(e.surname);
    if (key && e.imageDataUrl) map.set(key, e.imageDataUrl);
  }
  return map;
}

/** Нормализация фамилии для сопоставления с индексом подписей. */
export function surnameKey(surname: string): string {
  return normSurname(surname);
}

export function upsertSignature(
  _projectId: string,
  surname: string,
  imageDataUrl: string,
  opts?: { id?: string; folderId?: string | null },
): SignatureLibEntry {
  const store = loadStore();
  const clean = surname.trim();
  if (!clean) throw new Error("Укажите фамилию");
  if (!imageDataUrl.startsWith("data:image/")) {
    throw new Error("Нужна картинка подписи");
  }
  const folderId = opts?.folderId ?? null;
  if (folderId) {
    const f = store.folders.find((x) => x.id === folderId);
    if (!f) {
      throw new Error("Папка не найдена");
    }
  }
  if (opts?.id) {
    const idx = store.entries.findIndex((e) => e.id === opts.id);
    if (idx >= 0) {
      store.entries[idx] = {
        ...store.entries[idx],
        surname: clean,
        imageDataUrl,
        folderId,
      };
      saveStore(store);
      return store.entries[idx];
    }
  }
  const existing = store.entries.findIndex(
    (e) => normSurname(e.surname) === normSurname(clean),
  );
  const entry: SignatureLibEntry = {
    id: existing >= 0 ? store.entries[existing].id : uid("sig"),
    folderId:
      existing >= 0
        ? opts?.folderId !== undefined
          ? folderId
          : (store.entries[existing].folderId ?? null)
        : folderId,
    surname: clean,
    imageDataUrl,
    createdAt:
      existing >= 0
        ? store.entries[existing].createdAt
        : new Date().toISOString(),
  };
  if (existing >= 0) store.entries[existing] = entry;
  else store.entries.push(entry);
  saveStore(store);
  return entry;
}

export function moveSignature(
  entryId: string,
  folderId: string | null,
): SignatureLibEntry | null {
  const store = loadStore();
  const entry = store.entries.find((e) => e.id === entryId);
  if (!entry) return null;
  if (folderId) {
    const f = store.folders.find((x) => x.id === folderId);
    if (!f) {
      throw new Error("Папка не найдена");
    }
  }
  entry.folderId = folderId;
  saveStore(store);
  return entry;
}

export function deleteSignature(id: string): void {
  const store = loadStore();
  store.entries = store.entries.filter((e) => e.id !== id);
  saveStore(store);
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}
