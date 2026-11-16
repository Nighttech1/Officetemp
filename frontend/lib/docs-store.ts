/** Local-first Documents / Projects store (localStorage + IndexedDB templates). */

import { signatureImageIndex, surnameKey } from "@/lib/signature-library";

const STORE_KEY = "docsaas_docs_v1";
const DB_NAME = "docsaas_docs_files";
const BLOB_STORE = "blobs";

// Тяжёлый распарсенный реестр накладной (wizard.rows) НЕ храним в localStorage
// — он переполняет квоту docsaas_docs_v1. Держим его в сессионном кэше (RAM) и
// в IndexedDB (большая квота); localStorage хранит только метаданные.
const _rowsCache = new Map<string, Record<string, unknown>[]>();
// Какие массивы rows уже записаны в IDB (чтобы не перезаписывать без изменений).
const _rowsIdbWritten = new WeakSet<object>();

export type DocKind = "waybill" | "info_sheet";

export type Project = {
  id: string;
  kind: DocKind;
  name: string;
  createdAt: string;
  /**
   * Настройки ИУЛ проекта.
   * fixedRoles — фиксированный набор вкладок/строк;
   * overflowRole — куда писать роли из PDF, которых нет в fixedRoles;
   * defaultHashAlgo — стартовый алгоритм хэша (пакет / новый ИУЛ).
   */
  iulSignSettings?: {
    fixedRoles: string[];
    overflowRole: string;
    defaultHashAlgo?: InfoSheetHashAlgo;
  };
  /** Профили реестра накладных (шаг 5). */
  waybillRegistrySettings?: WaybillRegistrySettings;
};

export type WaybillRegistryProfile = {
  id: string;
  name: string;
  registryUrl: string;
  registryMap: Record<string, string>;
};

export type WaybillRegistrySettings = {
  profiles: WaybillRegistryProfile[];
  activeProfileId: string | null;
};

/** Папка внутри проекта (дерево). systemKey — не удаляется. */
export type ProjectFolderSystemKey = "signatures" | "iul" | "waybills";

export type ProjectFolder = {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  systemKey?: ProjectFolderSystemKey;
  createdAt: string;
};

export type WaybillWizardState = {
  /** 1 Шаблон → 2 Данные → 3 Стыковка → 4 Реестр (шаг «Генерация» убран). */
  step: 1 | 2 | 3 | 4;
  templateName: string;
  tags: string[];
  columns: string[];
  rows: Record<string, unknown>[];
  mapping: Record<string, string>;
  dataFilename: string;
  dataUrl?: string;
  /** Имя листа Excel (страница книги) — основный/первый выбранный. */
  sheetName?: string;
  /** Список листов последней загруженной книги. */
  sheetNames?: string[];
  /** Листы, выбранные пользователем (мультивыбор) для колонок и строк. */
  selectedSheetNames?: string[];
  registryUrl?: string;
  registryMap?: Record<string, string>;
  lastGenerateNote?: string;
  /** 1-based inclusive: первая строка данных из файла (после заголовка). */
  rowFrom?: number;
  /** 1-based inclusive: последняя строка данных из файла. */
  rowTo?: number;
  /**
   * true только после явного выбора диапазона строк на стыковке.
   * Без флага превью/генерация НЕ подставляют данные (даже если rowFrom/rowTo остались в storage).
   */
  rowRangeConfirmed?: boolean;
};

/**
 * Мастер сейчас: 1 Шаблон → 2 Данные → 3 Стыковка → 4 Реестр.
 * Legacy: step 5 (старый реестр) → 4. Step 4 больше НЕ схлопываем в 3
 * (иначе вкладка «Реестр» невозможно открыть).
 */
export function normalizeWaybillStep(step: number): 1 | 2 | 3 | 4 {
  if (step <= 1) return 1;
  if (step === 2) return 2;
  if (step === 3) return 3;
  if (step === 4) return 4;
  return 4; // legacy 5+
}

export type InfoSheetHashAlgo = "MD5" | "SHA-1" | "SHA-256" | "CRC32";

export type InfoSheetSignature = {
  role: string;
  surname: string;
  signedAt: string;
  note: string;
  /** Data URL PNG/JPEG из библиотеки подписей. */
  signatureImageDataUrl?: string;
};

/** Мастер ИУЛ (информационно-удостоверительный лист). */
export type InfoSheetWizardState = {
  /** 1 Файл → 2 Документ → 3 Подписи (бывший шаг 4 PDF слит с Документом) */
  step: 1 | 2 | 3;
  sourceFileName: string;
  fileSizeBytes: number | null;
  fileModifiedAt: string;
  hashAlgo: InfoSheetHashAlgo;
  fileHash: string;
  objectName: string;
  docDesignation: string;
  docName: string;
  docVersion: string;
  signatures: InfoSheetSignature[];
  /** Откуда брать картинки подписей. */
  signatureSource: "library" | "pdf";
  ulCode: string;
  sheetNo: string;
  sheetsTotal: string;
  lastGenerateNote?: string;
};

export type DocItem = {
  id: string;
  projectId: string;
  /** Папка внутри проекта; null — корень проекта. */
  folderId: string | null;
  kind: DocKind;
  title: string;
  version: number;
  parentId: string | null;
  status: "draft" | "ready";
  wizard: WaybillWizardState;
  /** Заполняется для kind === "info_sheet". */
  iulWizard?: InfoSheetWizardState;
  /** Серверный ключ Word-шаблона (MinIO/S3 / local blob). IndexedDB — кэш. */
  templateStorageKey?: string;
  /** Серверный ключ файла данных Excel/CSV. */
  dataFileStorageKey?: string;
  createdAt: string;
  updatedAt: string;
};

export type DocsStore = {
  projects: Project[];
  folders: ProjectFolder[];
  documents: DocItem[];
};

export function emptyWizard(): WaybillWizardState {
  return {
    step: 1,
    templateName: "",
    tags: [],
    columns: [],
    rows: [],
    mapping: {},
    dataFilename: "",
    dataUrl: undefined,
    sheetName: undefined,
    sheetNames: undefined,
    selectedSheetNames: undefined,
    registryUrl: undefined,
    registryMap: undefined,
    lastGenerateNote: undefined,
    rowRangeConfirmed: false,
    rowFrom: undefined,
    rowTo: undefined,
  };
}

export function emptyIulWizard(): InfoSheetWizardState {
  return {
    step: 1,
    sourceFileName: "",
    fileSizeBytes: null,
    fileModifiedAt: "",
    hashAlgo: "MD5",
    fileHash: "",
    objectName: "",
    docDesignation: "",
    docName: "",
    docVersion: "",
    signatures: [{ role: "", surname: "", signedAt: "", note: "" }],
    signatureSource: "library",
    ulCode: "",
    sheetNo: "1",
    sheetsTotal: "1",
    lastGenerateNote: undefined,
  };
}

/** Стартовый алгоритм хэша проекта (по умолчанию MD5). */
export function projectDefaultHashAlgo(
  projectId: string | null | undefined,
): InfoSheetHashAlgo {
  if (!projectId) return "MD5";
  const algo = getProject(projectId)?.iulSignSettings?.defaultHashAlgo;
  return algo ?? "MD5";
}

/**
 * Нормализация шага ИУЛ.
 * Схема v3: 1 Файл → 2 Документ (+ колонтитул) → 3 Подписи.
 * Старые step 4/5 (PDF) → 3.
 */
export function normalizeIulStep(step: number): 1 | 2 | 3 {
  if (step <= 1) return 1;
  if (step === 2) return 2;
  if (step === 3) return 3;
  if (step >= 4) return 3;
  return 1;
}

/** Подставить картинки подписей по фамилии (синхронно, если dataUrl уже в lib meta). */
export function attachSignatureImages(
  signatures: InfoSheetSignature[],
  lookup: (surname: string) => string | undefined,
): InfoSheetSignature[] {
  return signatures.map((s) => {
    const url = s.surname ? lookup(s.surname) : undefined;
    return url ? { ...s, signatureImageDataUrl: url } : { ...s, signatureImageDataUrl: undefined };
  });
}

function emptyStore(): DocsStore {
  return { projects: [], folders: [], documents: [] };
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function migrateIul(doc: DocItem): DocItem {
  if (!doc.iulWizard) return doc;
  const step = normalizeIulStep(Number(doc.iulWizard.step) || 1);
  return { ...doc, iulWizard: { ...doc.iulWizard, step }, folderId: doc.folderId ?? null };
}

export function loadStore(): DocsStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<DocsStore>;
    const store: DocsStore = {
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      documents: Array.isArray(parsed.documents)
        ? parsed.documents.map((d) =>
            migrateIul({ ...d, folderId: d.folderId ?? null }),
          )
        : [],
    };
    let dirty = false;
    for (const p of store.projects) {
      if (purgeObsoleteSystemFolders(store, p.id)) dirty = true;
    }
    if (mergeDemoProjects(store)) dirty = true;
    if (dirty) saveStore(store);
    hydrateSignatureImagesInStore(store);
    hydrateWaybillRowsInStore(store);
    return store;
  } catch {
    return emptyStore();
  }
}

/** Восстановить картинки подписей из общей библиотеки по фамилии (их не храним). */
function hydrateSignatureImagesInStore(store: DocsStore): void {
  if (typeof window === "undefined") return;
  let index: Map<string, string> | null = null;
  for (const d of store.documents) {
    const iul = d.iulWizard;
    if (!iul || !Array.isArray(iul.signatures) || iul.signatures.length === 0) {
      continue;
    }
    if (!iul.signatures.some((s) => s.surname && !s.signatureImageDataUrl)) {
      continue;
    }
    if (index === null) index = signatureImageIndex();
    iul.signatures = iul.signatures.map((s) => {
      if (s.signatureImageDataUrl || !s.surname) return s;
      const img = index!.get(surnameKey(s.surname));
      return img ? { ...s, signatureImageDataUrl: img } : s;
    });
  }
}

/** Восстановить реестр накладной (wizard.rows) из сессионного кэша (их не храним). */
function hydrateWaybillRowsInStore(store: DocsStore): void {
  for (const d of store.documents) {
    const w = d.wizard;
    if (!w || !Array.isArray(w.rows) || w.rows.length > 0) continue;
    const cached = _rowsCache.get(d.id);
    if (cached && cached.length) w.rows = cached;
  }
}

/**
 * Готовим store к записи в localStorage без тяжёлых полей, раздувающих квоту:
 *  - картинки подписей (base64) — источник правды в общей библиотеке подписей;
 *  - реестр накладной (wizard.rows) — уводим в сессионный кэш + IndexedDB.
 */
function stripHeavyForPersist(store: DocsStore): DocsStore {
  let touched = false;
  const documents = store.documents.map((d) => {
    let nd = d;
    const iul = d.iulWizard;
    if (
      iul &&
      Array.isArray(iul.signatures) &&
      iul.signatures.some((s) => s.signatureImageDataUrl)
    ) {
      nd = {
        ...nd,
        iulWizard: {
          ...iul,
          signatures: iul.signatures.map((s) =>
            s.signatureImageDataUrl
              ? { ...s, signatureImageDataUrl: undefined }
              : s,
          ),
        },
      };
      touched = true;
    }
    const w = d.wizard;
    if (w && Array.isArray(w.rows) && w.rows.length > 0) {
      _rowsCache.set(d.id, w.rows);
      if (!_rowsIdbWritten.has(w.rows)) {
        _rowsIdbWritten.add(w.rows);
        void putRowsIdb(d.id, w.rows); // в IDB пишем только при смене массива
      }
      nd = { ...nd, wizard: { ...nd.wizard, rows: [] } };
      touched = true;
    }
    return nd;
  });
  return touched ? { ...store, documents } : store;
}

export function saveStore(store: DocsStore): void {
  if (typeof window === "undefined") return;
  const persistable = stripHeavyForPersist(store);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(persistable));
  } catch {
    // Квота всё равно превышена (старые тяжёлые записи) — чистим мусор прежних
    // версий и пробуем ещё раз (тяжёлые поля уже вынесены).
    try {
      localStorage.removeItem("docsaas_sign_lib_v3");
      localStorage.removeItem("docsaas_sign_lib_v2");
      localStorage.setItem(STORE_KEY, JSON.stringify(persistable));
    } catch {
      /* не удалось сохранить локально — сервер всё равно получит снапшот */
    }
  }
  // Dual-write: debounce push to Postgres (server = source of truth).
  void import("@/lib/workspace-sync").then((m) => m.scheduleWorkspacePush());
}

/** Асинхронно подтянуть реестр накладной из IndexedDB (после перезагрузки). */
export async function loadWaybillRowsFromIdb(
  docId: string,
): Promise<Record<string, unknown>[] | null> {
  const cached = _rowsCache.get(docId);
  if (cached && cached.length) return cached;
  const rows = await getRowsIdb(docId);
  if (rows && rows.length) {
    _rowsCache.set(docId, rows);
    _rowsIdbWritten.add(rows); // уже в IDB — повторно не писать
    return rows;
  }
  return null;
}

/**
 * C-220/C-222: системные папки ИУЛ/Накладные больше не используются.
 * Сносим их (и дубли без systemKey с теми же именами в корне),
 * документы/подпапки поднимаем на уровень родителя удалённой папки (обычно корень).
 */
function purgeObsoleteSystemFolders(
  store: DocsStore,
  projectId: string,
): boolean {
  const junkNames = new Set(["ИУЛ", "Накладные"]);
  const junkIds = new Set(
    store.folders
      .filter((f) => {
        if (f.projectId !== projectId) return false;
        if (f.systemKey === "iul" || f.systemKey === "waybills") return true;
        // Дубли после sync, когда backend обнулил systemKey
        if (
          junkNames.has(f.name) &&
          (f.parentId ?? null) === null &&
          f.systemKey !== "signatures"
        ) {
          return true;
        }
        return false;
      })
      .map((f) => f.id),
  );
  if (junkIds.size === 0) return false;

  for (const f of store.folders) {
    if (f.parentId && junkIds.has(f.parentId)) {
      f.parentId = null;
    }
  }
  for (const doc of store.documents) {
    if (doc.folderId && junkIds.has(doc.folderId)) {
      doc.folderId = null;
    }
  }
  store.folders = store.folders.filter((f) => !junkIds.has(f.id));
  return true;
}

/** @deprecated C-222: папки iul/waybills сняты; оставлено для совместимости API. */
function ensureProjectSystemFolders(
  store: DocsStore,
  projectId: string,
): boolean {
  return purgeObsoleteSystemFolders(store, projectId);
}

/** Публичная миграция: снос устаревших папок ИУЛ/Накладные (C-222). */
export function migrateWorkspaceFolders(store: DocsStore): boolean {
  let dirty = false;
  for (const p of store.projects) {
    if (purgeObsoleteSystemFolders(store, p.id)) dirty = true;
  }
  return dirty;
}

/** Все проекты (ИУЛ и накладные в одном дереве). */
export function listAllProjects(): Project[] {
  const store = loadStore();
  // Миграция: снос устаревших системных папок ИУЛ/Накладные
  let dirty = false;
  for (const p of store.projects) {
    if (purgeObsoleteSystemFolders(store, p.id)) dirty = true;
  }
  if (dirty) saveStore(store);
  return [...store.projects].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function listProjects(kind: DocKind): Project[] {
  // Единое дерево: оба раздела видят все проекты
  void kind;
  return listAllProjects();
}

export function getProject(projectId: string): Project | null {
  return loadStore().projects.find((p) => p.id === projectId) ?? null;
}

export function createProject(kind: DocKind, name: string): Project {
  const store = loadStore();
  const project: Project = {
    id: uid("prj"),
    kind,
    name: name.trim() || "Новый проект",
    createdAt: new Date().toISOString(),
  };
  store.projects.push(project);
  saveStore(store);
  return project;
}

export function renameProject(projectId: string, name: string): Project | null {
  const store = loadStore();
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return null;
  project.name = name.trim() || project.name;
  saveStore(store);
  return project;
}

export function updateProjectIulSignSettings(
  projectId: string,
  settings: {
    fixedRoles: string[];
    overflowRole: string;
    defaultHashAlgo?: InfoSheetHashAlgo;
  } | null,
): Project | null {
  const store = loadStore();
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return null;
  if (!settings) {
    delete project.iulSignSettings;
  } else {
    const roles = settings.fixedRoles.map((r) => r.trim()).filter(Boolean);
    const algo = settings.defaultHashAlgo ?? "MD5";
    project.iulSignSettings = {
      fixedRoles: roles,
      overflowRole: settings.overflowRole.trim() || "Прочие",
      defaultHashAlgo: algo,
    };
  }
  saveStore(store);
  return project;
}

function emptyWaybillRegistrySettings(): WaybillRegistrySettings {
  return { profiles: [], activeProfileId: null };
}

function ensureWaybillRegistrySettings(project: Project): WaybillRegistrySettings {
  if (!project.waybillRegistrySettings) {
    project.waybillRegistrySettings = emptyWaybillRegistrySettings();
  }
  return project.waybillRegistrySettings;
}

export function listWaybillRegistryProfiles(
  projectId: string,
): WaybillRegistryProfile[] {
  const project = getProject(projectId);
  if (!project) return [];
  return ensureWaybillRegistrySettings(project).profiles;
}

export function getActiveWaybillRegistryProfile(
  projectId: string,
): WaybillRegistryProfile | null {
  const project = getProject(projectId);
  if (!project?.waybillRegistrySettings) return null;
  const { profiles, activeProfileId } = project.waybillRegistrySettings;
  if (!activeProfileId) return null;
  return profiles.find((p) => p.id === activeProfileId) ?? null;
}

export function createWaybillRegistryProfile(
  projectId: string,
  input: { name: string; registryUrl?: string; registryMap?: Record<string, string> },
): WaybillRegistryProfile | null {
  const store = loadStore();
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return null;
  const settings = ensureWaybillRegistrySettings(project);
  const profile: WaybillRegistryProfile = {
    id: uid("wreg"),
    name: input.name.trim() || "Профиль реестра",
    registryUrl: (input.registryUrl ?? "").trim(),
    registryMap: { ...(input.registryMap ?? {}) },
  };
  settings.profiles.push(profile);
  saveStore(store);
  return profile;
}

export function updateWaybillRegistryProfile(
  projectId: string,
  profileId: string,
  patch: Partial<
    Pick<WaybillRegistryProfile, "name" | "registryUrl" | "registryMap">
  >,
): WaybillRegistryProfile | null {
  const store = loadStore();
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return null;
  const settings = ensureWaybillRegistrySettings(project);
  const profile = settings.profiles.find((p) => p.id === profileId);
  if (!profile) return null;
  if (patch.name !== undefined) profile.name = patch.name.trim() || profile.name;
  if (patch.registryUrl !== undefined) profile.registryUrl = patch.registryUrl.trim();
  if (patch.registryMap !== undefined) {
    profile.registryMap = { ...patch.registryMap };
  }
  saveStore(store);
  return profile;
}

export function deleteWaybillRegistryProfile(
  projectId: string,
  profileId: string,
): boolean {
  const store = loadStore();
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return false;
  const settings = ensureWaybillRegistrySettings(project);
  const before = settings.profiles.length;
  settings.profiles = settings.profiles.filter((p) => p.id !== profileId);
  if (settings.activeProfileId === profileId) {
    settings.activeProfileId = settings.profiles[0]?.id ?? null;
  }
  if (settings.profiles.length === before) return false;
  saveStore(store);
  return true;
}

export function setActiveWaybillRegistryProfile(
  projectId: string,
  profileId: string | null,
): Project | null {
  const store = loadStore();
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return null;
  const settings = ensureWaybillRegistrySettings(project);
  if (profileId && !settings.profiles.some((p) => p.id === profileId)) {
    return null;
  }
  settings.activeProfileId = profileId;
  saveStore(store);
  return project;
}

/** Подставить активный профиль реестра в новый мастер накладной. */
export function waybillRegistryFromActiveProfile(
  projectId: string,
): Pick<WaybillWizardState, "registryUrl" | "registryMap"> | null {
  const active = getActiveWaybillRegistryProfile(projectId);
  if (!active) return null;
  return {
    registryUrl: active.registryUrl,
    registryMap: { ...active.registryMap },
  };
}

/**
 * Константный список характеров работы для формирования ИУЛ.
 * В характере работы ИУЛ есть ТОЛЬКО эти роли, в этом порядке.
 * Прочие найденные в PDF характеры работы → «Разработал».
 * «Н. Контр.» (нормоконтроль во всех написаниях) и «ГИП» — не более
 * одного человека каждый; «Разработал» и «Проверил» — сколько есть.
 */
export const IUL_CANONICAL_ROLES = [
  "Разработал",
  "Проверил",
  "Н. Контр.",
  "ГИП",
] as const;

export type IulCanonicalRole = (typeof IUL_CANONICAL_ROLES)[number];

/** Применить правила формирования подписей ИУЛ (C-89 / C-91 / константный список). */
export function applyProjectRoleSettings(
  found: InfoSheetSignature[],
  settings?: Project["iulSignSettings"] | null,
): InfoSheetSignature[] {
  const blank: InfoSheetSignature = {
    role: "",
    surname: "",
    signedAt: "",
    note: "",
  };
  const norm = (s: string) =>
    s.trim().toLowerCase().replace(/ё/g, "е");
  const compact = (s: string) =>
    norm(s).replace(/\./g, "").replace(/\s+/g, "");

  /** Семейства ролей: варианты из PDF → один ключ для матча с настройками. */
  const roleFamily = (role: string): string => {
    const c = compact(role);
    if (c === "гип" || c === "gip") return "gip";
    if (
      c.includes("нормоконтрол") ||
      c === "нконтр" ||
      c === "нконтроль" ||
      c === "нормоконтр" ||
      (c.startsWith("н") && c.includes("контр") && !c.includes("изм"))
    ) {
      return "normocontrol";
    }
    return `exact:${norm(role)}`;
  };

  const isGip = (role: string) => roleFamily(role) === "gip";

  if (!found.length && !settings?.fixedRoles?.length) {
    return [{ ...blank }];
  }

  const fixed = (settings?.fixedRoles ?? [])
    .map((r) => r.trim())
    .filter(Boolean);
  const overflow =
    (settings?.overflowRole || "").trim() ||
    fixed[fixed.length - 1] ||
    "Прочие";

  const matchFixed = (foundRole: string): string | null => {
    if (!fixed.length) return null;
    const rn = norm(foundRole);
    const exact = fixed.find((f) => norm(f) === rn);
    if (exact) return exact;
    const fam = roleFamily(foundRole);
    if (fam.startsWith("exact:")) return null;
    const byFam = fixed.find((f) => roleFamily(f) === fam);
    return byFam ?? null;
  };

  // 1) Канонизация ролей / overflow — имя как в настройках
  let list: InfoSheetSignature[] = found.map((s) => {
    if (!fixed.length) return { ...s };
    const canonical = matchFixed(s.role);
    if (canonical) return { ...s, role: canonical };
    if (!s.role.trim()) return { ...s };
    return { ...s, role: overflow };
  });

  // 2) ГИП эксклюзивен по фамилии
  const gipSurnames = new Set(
    list
      .filter((s) => isGip(s.role) && s.surname.trim())
      .map((s) => norm(s.surname)),
  );
  if (gipSurnames.size) {
    list = list.filter((s) => {
      if (!s.surname.trim()) return true;
      if (gipSurnames.has(norm(s.surname)) && !isGip(s.role)) return false;
      return true;
    });
  }

  // 3) Уникальная пара (характер, фамилия)
  const seen = new Set<string>();
  list = list.filter((s) => {
    const key = `${norm(s.role)}|${norm(s.surname)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const isRazrabotal = (role: string) => {
    const c = compact(role);
    return c === "разработал" || c.startsWith("разработ");
  };
  const isProveril = (role: string) => {
    const c = compact(role);
    return c === "проверил" || c.startsWith("провер");
  };
  /** Характер работы из PDF → одна из ролей константного списка ИУЛ. */
  const canonicalIulRole = (role: string): IulCanonicalRole => {
    const fam = roleFamily(role);
    if (fam === "gip") return "ГИП";
    if (fam === "normocontrol") return "Н. Контр.";
    if (isProveril(role)) return "Проверил";
    return "Разработал"; // «разработал» + любой иной найденный характер работы
  };

  // 3b) C-105 (режим пользовательского списка): все роли кроме «Разработал» —
  // только первая фамилия. В константном режиме (без fixedRoles) ограничение
  // «1 человек» применяется точечно ниже — только к «Н. Контр.» и «ГИП».
  if (fixed.length) {
    const keptRole = new Set<string>();
    list = list.filter((s) => {
      if (isRazrabotal(s.role)) return true;
      const key = roleFamily(s.role).startsWith("exact:")
        ? norm(s.role)
        : roleFamily(s.role);
      if (keptRole.has(key)) return false;
      keptRole.add(key);
      return true;
    });
  }

  // 4) Константное правило формирования ИУЛ (проект не задал свой список):
  //    характер работы приводится к IUL_CANONICAL_ROLES, прочие → «Разработал»,
  //    порядок строгий, «Н. Контр.» и «ГИП» — не более одного человека.
  if (!fixed.length) {
    const realSigners = list.filter((s) => s.surname.trim());
    if (!realSigners.length) {
      return list.length ? list : [{ ...blank }];
    }
    const buckets: Record<IulCanonicalRole, InfoSheetSignature[]> = {
      "Разработал": [],
      "Проверил": [],
      "Н. Контр.": [],
      "ГИП": [],
    };
    for (const s of realSigners) {
      const bucket = canonicalIulRole(s.role);
      buckets[bucket].push({ ...s, role: bucket });
    }
    const singlePerson = new Set<IulCanonicalRole>(["Н. Контр.", "ГИП"]);
    const ordered: InfoSheetSignature[] = [];
    for (const role of IUL_CANONICAL_ROLES) {
      // Внутри одной роли — без повторов по фамилии: один человек под
      // несколькими «прочими» характерами не дублируется в «Разработал».
      const seenSur = new Set<string>();
      const uniq = buckets[role].filter((s) => {
        const k = norm(s.surname);
        if (seenSur.has(k)) return false;
        seenSur.add(k);
        return true;
      });
      const entries = singlePerson.has(role) ? uniq.slice(0, 1) : uniq;
      ordered.push(...entries);
    }
    return ordered.length ? ordered : [{ ...blank }];
  }

  const ordered: InfoSheetSignature[] = [];
  for (const role of fixed) {
    const entries = list.filter((s) => {
      if (norm(s.role) === norm(role)) return true;
      return (
        roleFamily(s.role) === roleFamily(role) &&
        !roleFamily(role).startsWith("exact:")
      );
    });
    if (entries.length === 0) {
      ordered.push({ ...blank, role });
    } else if (isRazrabotal(role)) {
      for (const e of entries) {
        ordered.push({ ...e, role });
      }
    } else {
      // C-105: одна фамилия (первая)
      ordered.push({ ...entries[0], role });
    }
  }
  // Остальные (overflow), без дублей
  const outSeen = new Set<string>();
  for (const s of list) {
    if (fixed.some((f) => norm(f) === norm(s.role) || (!roleFamily(f).startsWith("exact:") && roleFamily(f) === roleFamily(s.role)))) {
      continue;
    }
    const key = `${norm(s.role)}|${norm(s.surname)}`;
    if (outSeen.has(key)) continue;
    outSeen.add(key);
    ordered.push(s);
  }
  return ordered.length ? ordered : [{ ...blank }];
}

export function deleteProject(projectId: string): void {
  const store = loadStore();
  store.projects = store.projects.filter((p) => p.id !== projectId);
  store.folders = store.folders.filter((f) => f.projectId !== projectId);
  store.documents = store.documents.filter((d) => d.projectId !== projectId);
  saveStore(store);
}

export function listFolders(projectId: string): ProjectFolder[] {
  return loadStore()
    .folders.filter(
      (f) => f.projectId === projectId && f.systemKey !== "signatures",
    )
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export function getFolder(folderId: string): ProjectFolder | null {
  return loadStore().folders.find((f) => f.id === folderId) ?? null;
}

export function getSignaturesFolder(projectId: string): ProjectFolder | null {
  return (
    loadStore().folders.find(
      (f) => f.projectId === projectId && f.systemKey === "signatures",
    ) ?? null
  );
}

export function createFolder(
  projectId: string,
  name: string,
  parentId: string | null = null,
): ProjectFolder {
  const store = loadStore();
  if (parentId) {
    const parent = store.folders.find((f) => f.id === parentId);
    if (!parent || parent.projectId !== projectId) {
      throw new Error("Родительская папка не найдена");
    }
    if (parent.systemKey === "signatures") {
      throw new Error("Нельзя создавать папки внутри «Подписи»");
    }
  }
  const folder: ProjectFolder = {
    id: uid("fld"),
    projectId,
    parentId,
    name: name.trim() || "Новая папка",
    createdAt: new Date().toISOString(),
  };
  store.folders.push(folder);
  saveStore(store);
  return folder;
}

/** Удаляет папку и всё содержимое (подпапки и документы). Системную — нельзя. */
export function deleteFolder(folderId: string): boolean {
  const store = loadStore();
  const folder = store.folders.find((f) => f.id === folderId);
  if (!folder) return false;
  if (folder.systemKey) return false; // любая системная папка

  const toRemove = new Set<string>();
  function collect(id: string) {
    toRemove.add(id);
    for (const f of store.folders) {
      if (f.parentId === id) collect(f.id);
    }
  }
  collect(folderId);
  store.folders = store.folders.filter((f) => !toRemove.has(f.id));
  store.documents = store.documents.filter(
    (d) => !d.folderId || !toRemove.has(d.folderId),
  );
  saveStore(store);
  return true;
}

export function listDocumentsInFolder(
  projectId: string,
  folderId: string | null,
): DocItem[] {
  return loadStore()
    .documents.filter(
      (d) =>
        d.projectId === projectId && (d.folderId ?? null) === (folderId ?? null),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listDocuments(projectId: string): DocItem[] {
  return loadStore()
    .documents.filter((d) => d.projectId === projectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDocument(docId: string): DocItem | null {
  const doc = loadStore().documents.find((d) => d.id === docId) ?? null;
  if (!doc || doc.kind !== "waybill") return doc;
  const step = normalizeWaybillStep(doc.wizard.step as number);
  if (step !== doc.wizard.step) {
    doc.wizard = { ...doc.wizard, step };
  }
  return doc;
}

/**
 * После успешной генерации DOCX/PDF — новый файл в дереве проекта
 * с номером накладной и снимком wizard (для повторного открытия).
 */
export function createGeneratedWaybillSnapshot(
  sourceDocId: string,
  title: string,
): DocItem | null {
  const store = loadStore();
  const src = store.documents.find((d) => d.id === sourceDocId);
  if (!src || src.kind !== "waybill") return null;
  const now = new Date().toISOString();
  const snapWizard = JSON.parse(
    JSON.stringify(src.wizard),
  ) as WaybillWizardState;
  snapWizard.step = 3;
  snapWizard.lastGenerateNote = `Снимок от ${now.slice(0, 19)}`;
  const doc: DocItem = {
    id: uid("doc"),
    projectId: src.projectId,
    folderId: src.folderId,
    kind: "waybill",
    title: (title.trim() || "Накладная").slice(0, 200),
    version: 1,
    parentId: src.id,
    status: "ready",
    wizard: snapWizard,
    templateStorageKey: src.templateStorageKey,
    dataFileStorageKey: src.dataFileStorageKey,
    createdAt: now,
    updatedAt: now,
  };
  store.documents.push(doc);
  saveStore(store);
  return doc;
}

export function createDocument(
  projectId: string,
  kind: DocKind,
  title?: string,
  folderId: string | null = null,
): DocItem {
  const store = loadStore();
  purgeObsoleteSystemFolders(store, projectId);
  let resolvedFolderId = folderId ?? null;
  if (resolvedFolderId) {
    const folder = store.folders.find((f) => f.id === resolvedFolderId);
    if (!folder || folder.projectId !== projectId) {
      throw new Error("Папка не найдена");
    }
    if (folder.systemKey === "signatures") {
      throw new Error("Нельзя создавать документы в «Подписи»");
    }
  }
  // C-222: без системных папок ИУЛ/Накладные — документ в выбранной папке или в корне
  const now = new Date().toISOString();
  const wizardBase = emptyWizard();
  if (kind === "waybill") {
    const reg = waybillRegistryFromActiveProfile(projectId);
    if (reg) {
      wizardBase.registryUrl = reg.registryUrl;
      wizardBase.registryMap = reg.registryMap;
    }
  }
  const doc: DocItem = {
    id: uid("doc"),
    projectId,
    folderId: resolvedFolderId,
    kind,
    title: (title?.trim() || "Новый документ").slice(0, 200),
    version: 1,
    parentId: null,
    status: "draft",
    wizard: wizardBase,
    iulWizard: kind === "info_sheet" ? emptyIulWizard() : undefined,
    createdAt: now,
    updatedAt: now,
  };
  store.documents.push(doc);
  saveStore(store);
  return doc;
}

/** Заголовок в дереве = обозначение УЛ (шифр). */
export function titleFromUlCipher(w: Partial<InfoSheetWizardState> | undefined): string | null {
  if (!w) return null;
  const cipher = (w.ulCode || w.docDesignation || "").trim();
  return cipher ? cipher.slice(0, 200) : null;
}

export function updateDocument(
  docId: string,
  patch: {
    title?: string;
    status?: DocItem["status"];
    wizard?: Partial<WaybillWizardState>;
    iulWizard?: Partial<InfoSheetWizardState>;
  },
): DocItem | null {
  const store = loadStore();
  const doc = store.documents.find((d) => d.id === docId);
  if (!doc) return null;
  if (patch.title !== undefined) doc.title = patch.title;
  if (patch.status !== undefined) doc.status = patch.status;
  if (patch.wizard !== undefined) {
    doc.wizard = { ...doc.wizard, ...patch.wizard };
  }
  if (patch.iulWizard !== undefined) {
    const base = doc.iulWizard ?? emptyIulWizard();
    doc.iulWizard = { ...base, ...patch.iulWizard };
    // C-108: имя в дереве = шифр УЛ
    if (patch.title === undefined) {
      const auto = titleFromUlCipher(doc.iulWizard);
      if (auto) doc.title = auto;
    }
  }
  doc.updatedAt = new Date().toISOString();
  saveStore(store);
  return doc;
}

export function deleteDocument(docId: string): void {
  const store = loadStore();
  store.documents = store.documents.filter((d) => d.id !== docId);
  saveStore(store);
  void deleteDocTemplate(docId).catch(() => undefined);
}

export function deleteDocuments(docIds: string[]): void {
  const unique = [...new Set(docIds.filter(Boolean))];
  for (const id of unique) {
    deleteDocument(id);
  }
}

/** Переименовать папку (системную «Подписи» — нельзя). */
export function renameFolder(folderId: string, name: string): ProjectFolder | null {
  const store = loadStore();
  const folder = store.folders.find((f) => f.id === folderId);
  if (!folder) return null;
  if (folder.systemKey) {
    throw new Error("Системную папку переименовать нельзя");
  }
  const next = name.trim();
  if (!next) throw new Error("Название не может быть пустым");
  folder.name = next.slice(0, 200);
  saveStore(store);
  return folder;
}

/** Переместить документ в папку (null = корень проекта). Нельзя в «Подписи». */
export function moveDocument(
  docId: string,
  folderId: string | null,
): DocItem | null {
  const store = loadStore();
  const doc = store.documents.find((d) => d.id === docId);
  if (!doc) return null;
  if (folderId) {
    const folder = store.folders.find((f) => f.id === folderId);
    if (!folder || folder.projectId !== doc.projectId) {
      throw new Error("Папка не найдена");
    }
    if (folder.systemKey === "signatures") {
      throw new Error("Нельзя перемещать документы в «Подписи»");
    }
  }
  doc.folderId = folderId;
  doc.updatedAt = new Date().toISOString();
  saveStore(store);
  return doc;
}

/** Переместить папку (не системную). parentId=null — корень проекта. */
export function moveFolder(
  folderId: string,
  parentId: string | null,
): ProjectFolder | null {
  const store = loadStore();
  const folder = store.folders.find((f) => f.id === folderId);
  if (!folder) return null;
  if (folder.systemKey === "signatures") {
    throw new Error("Системную папку «Подписи» перемещать нельзя");
  }
  if (parentId === folderId) {
    throw new Error("Папка не может быть родителем самой себя");
  }
  if (parentId) {
    const parent = store.folders.find((f) => f.id === parentId);
    if (!parent || parent.projectId !== folder.projectId) {
      throw new Error("Родительская папка не найдена");
    }
    if (parent.systemKey === "signatures") {
      throw new Error("Нельзя перемещать папки в «Подписи»");
    }
    // запрет цикла: parent не должен быть потомком folder
    let walk: string | null = parentId;
    while (walk) {
      if (walk === folderId) {
        throw new Error("Нельзя переместить папку внутрь своей подпапки");
      }
      walk =
        store.folders.find((f) => f.id === walk)?.parentId ?? null;
    }
  }
  folder.parentId = parentId;
  saveStore(store);
  return folder;
}

/** New version: version+1, parentId = old or root parent, wizard copied as draft. */
export function regenerateDocument(docId: string): DocItem | null {
  const store = loadStore();
  const old = store.documents.find((d) => d.id === docId);
  if (!old) return null;
  const rootParent = old.parentId ?? old.id;
  const now = new Date().toISOString();
  const next: DocItem = {
    id: uid("doc"),
    projectId: old.projectId,
    folderId: old.folderId ?? null,
    kind: old.kind,
    title: old.title,
    version: old.version + 1,
    parentId: rootParent,
    status: "draft",
    wizard: {
      ...JSON.parse(JSON.stringify(old.wizard)) as WaybillWizardState,
      step: 1,
      lastGenerateNote: undefined,
    },
    iulWizard: old.iulWizard
      ? {
          ...(JSON.parse(JSON.stringify(old.iulWizard)) as InfoSheetWizardState),
          step: 1,
          lastGenerateNote: undefined,
        }
      : old.kind === "info_sheet"
        ? emptyIulWizard()
        : undefined,
    createdAt: now,
    updatedAt: now,
  };
  store.documents.push(next);
  saveStore(store);
  void loadDocTemplate(old.id).then((file) => {
    if (file) return saveDocTemplate(next.id, file);
  });
  return next;
}

export function searchDocuments(projectId: string, query: string): DocItem[] {
  const q = query.trim().toLowerCase();
  const docs = listDocuments(projectId);
  if (!q) return docs;
  return docs.filter((d) => {
    if (d.title.toLowerCase().includes(q)) return true;
    if (`v${d.version}`.includes(q)) return true;
    if (d.status.toLowerCase().includes(q)) return true;
    const iw = d.iulWizard;
    if (iw) {
      if ((iw.docDesignation || "").toLowerCase().includes(q)) return true;
      if ((iw.docName || "").toLowerCase().includes(q)) return true;
      if ((iw.ulCode || "").toLowerCase().includes(q)) return true;
      if ((iw.objectName || "").toLowerCase().includes(q)) return true;
      if ((iw.sourceFileName || "").toLowerCase().includes(q)) return true;
    }
    return false;
  });
}

/** Схлопнуть дубликаты «Демо-проект» в один (остаётся самый старый). */
/** Схлопнуть дубликаты «Демо-проект» в один (остаётся самый старый). */
function mergeDemoProjects(store: DocsStore): boolean {
  const DEMO = "Демо-проект";
  const demos = store.projects.filter((p) => p.name === DEMO);
  if (demos.length <= 1) return false;
  const keep = demos.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  const dropIds = new Set(demos.filter((p) => p.id !== keep.id).map((p) => p.id));
  for (const doc of store.documents) {
    if (dropIds.has(doc.projectId)) doc.projectId = keep.id;
  }
  for (const f of store.folders) {
    if (dropIds.has(f.projectId)) f.projectId = keep.id;
  }
  const seenSys = new Set<string>();
  store.folders = store.folders.filter((f) => {
    if (f.projectId !== keep.id || !f.systemKey) return true;
    if (seenSys.has(f.systemKey)) return false;
    seenSys.add(f.systemKey);
    return true;
  });
  store.projects = store.projects.filter((p) => !dropIds.has(p.id));
  purgeObsoleteSystemFolders(store, keep.id);
  return true;
}

const DEMO_NAME = "Демо-проект";

/**
 * Для теста: всегда есть демо-проект.
 * Оба раздела (kind) делят один «Демо-проект», если он уже есть с любым kind.
 */
export function ensureDemoWorkspace(kind: DocKind): {
  projectId: string;
  docId: string;
} {
  const store = loadStore();
  let project = store.projects.find((p) => p.name === DEMO_NAME);
  if (!project) {
    project = {
      id: uid("prj"),
      kind: "info_sheet",
      name: DEMO_NAME,
      createdAt: new Date().toISOString(),
    };
    store.projects.unshift(project);
    const now = new Date().toISOString();
    for (const title of ["ИУЛ — образец", "ИУЛ — черновик"]) {
      store.documents.push({
        id: uid("doc"),
        projectId: project.id,
        folderId: null,
        kind: "info_sheet",
        title,
        version: 1,
        parentId: null,
        status: "draft",
        wizard: emptyWizard(),
        iulWizard: emptyIulWizard(),
        createdAt: now,
        updatedAt: now,
      });
    }
    for (const title of ["Накладная №001", "Накладная №002"]) {
      store.documents.push({
        id: uid("doc"),
        projectId: project.id,
        folderId: null,
        kind: "waybill",
        title,
        version: 1,
        parentId: null,
        status: "draft",
        wizard: emptyWizard(),
        createdAt: now,
        updatedAt: now,
      });
    }
    saveStore(store);
  } else {
    purgeObsoleteSystemFolders(store, project.id);
    saveStore(store);
  }
  const docs = listDocuments(project.id).filter((d) => d.kind === kind);
  let docId = docs[0]?.id;
  if (!docId) {
    docId = createDocument(
      project.id,
      kind,
      kind === "info_sheet" ? "Новый ИУЛ" : "Новый документ",
    ).id;
  }
  return { projectId: project.id, docId };
}

/** Нормализует 1-based диапазон к индексам массива rows. */
export function resolveRowRange(
  wizard: WaybillWizardState,
): { fromIdx: number; toIdx: number; selected: Record<string, unknown>[] } {
  const n = wizard.rows.length;
  if (n === 0) return { fromIdx: 0, toIdx: -1, selected: [] };
  // Только после явного подтверждения диапазона на стыковке.
  if (
    !wizard.rowRangeConfirmed ||
    typeof wizard.rowFrom !== "number" ||
    typeof wizard.rowTo !== "number"
  ) {
    return { fromIdx: 0, toIdx: -1, selected: [] };
  }
  const from1 = Math.min(Math.max(wizard.rowFrom, 1), n);
  const to1 = Math.min(Math.max(wizard.rowTo, from1), n);
  const fromIdx = from1 - 1;
  const toIdx = to1 - 1;
  return {
    fromIdx,
    toIdx,
    selected: wizard.rows.slice(fromIdx, toIdx + 1),
  };
}

/**
 * Контекст для генерации:
 * - обычные поля {{номер}} — из первой строки выбранного диапазона;
 * - поля вида row.name / item.qty — собираются в массивы row / item из диапазона;
 * - mapping[tag] === "__seq__" → порядковый номер 1…n в диапазоне;
 * - всегда кладём `rows` = выбранные строки (все колонки файла) для циклов
 *   {%tr for row in rows %}.
 */
export function buildWizardContext(
  wizard: WaybillWizardState,
  _rowIndex = 0,
): Record<string, unknown> {
  const { selected } = resolveRowRange(wizard);
  const headerRow = selected[0] ?? {};
  const ctx: Record<string, unknown> = {};
  const SEQ = "__seq__";

  const listFields: Record<string, Record<string, string>> = {};

  for (const [tag, column] of Object.entries(wizard.mapping)) {
    if (!column) continue;
    const dotted = /^([A-Za-zА-Яа-я_][\wА-Яа-я]*)\.([A-Za-zА-Яа-я_][\wА-Яа-я]*)$/u.exec(
      tag.trim(),
    );
    if (dotted) {
      const [, listName, field] = dotted;
      if (!listFields[listName]) listFields[listName] = {};
      listFields[listName][field] = column;
      continue;
    }
    if (column === SEQ) {
      ctx[tag] = "1";
      if (/\s/.test(tag)) ctx[tag.replace(/\s+/g, "_")] = "1";
      continue;
    }
    const val = headerRow[column] ?? "";
    ctx[tag] = val;
    // Jinja не любит пробелы в именах: {{section name}} → section_name
    if (/\s/.test(tag)) ctx[tag.replace(/\s+/g, "_")] = val;
  }

  for (const [listName, fields] of Object.entries(listFields)) {
    ctx[listName] = selected.map((row, i) => {
      const obj: Record<string, unknown> = {};
      for (const [field, col] of Object.entries(fields)) {
        obj[field] = col === SEQ ? String(i + 1) : (row[col] ?? "");
      }
      return obj;
    });
  }

  // Полные строки диапазона — удобно для {%tr for row in rows %}{{ row.Колонка }}
  ctx.rows = selected.map((r, i) => ({ ...r, [SEQ]: String(i + 1), n: String(i + 1) }));

  // Плоские теги шаблона ({{number}}, {{name}}) → массив items для {%tr for item in items %}
  // чтобы таблица Word без заранее прописанного цикла всё равно размножила строки.
  const flatMapped = Object.entries(wizard.mapping).filter(
    ([tag, column]) => Boolean(column) && !tag.includes("."),
  );
  if (flatMapped.length > 0 && selected.length > 0) {
    ctx.items = selected.map((row, i) => {
      const obj: Record<string, unknown> = {};
      for (const [tag, column] of flatMapped) {
        const v = column === SEQ ? String(i + 1) : (row[column] ?? "");
        obj[tag] = v;
        if (/\s/.test(tag)) obj[tag.replace(/\s+/g, "_")] = v;
      }
      return obj;
    });
  }

  return ctx;
}

function openDocsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

/** Сохранить реестр накладной в IndexedDB (большая квота, в отличие от localStorage). */
async function putRowsIdb(
  docId: string,
  rows: Record<string, unknown>[],
): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDocsDb();
    const tx = db.transaction(BLOB_STORE, "readwrite");
    tx.objectStore(BLOB_STORE).put(JSON.stringify(rows), `rows:${docId}`);
  } catch {
    /* IDB недоступен — реестр останется в сессионном кэше до перезагрузки */
  }
}

async function getRowsIdb(
  docId: string,
): Promise<Record<string, unknown>[] | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openDocsDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(BLOB_STORE, "readonly");
      const req = tx.objectStore(BLOB_STORE).get(`rows:${docId}`);
      req.onsuccess = () => {
        try {
          resolve(req.result ? JSON.parse(req.result as string) : null);
        } catch {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveDocTemplate(docId: string, file: File): Promise<void> {
  await putBlob(docId, file);
  try {
    const { uploadStorageObject } = await import("@/lib/api");
    const up = await uploadStorageObject(file, { docId, kind: "template" });
    const store = loadStore();
    const idx = store.documents.findIndex((d) => d.id === docId);
    if (idx >= 0) {
      store.documents[idx] = {
        ...store.documents[idx],
        templateStorageKey: up.key,
        updatedAt: new Date().toISOString(),
      };
      saveStore(store);
    }
  } catch {
    /* offline / API down — IndexedDB already has the file */
  }
}

export async function loadDocTemplate(docId: string): Promise<File | null> {
  const local = await getBlob(
    docId,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  if (local) return local;
  const doc = getDocument(docId);
  const key = doc?.templateStorageKey;
  if (!key) return null;
  try {
    const { downloadStorageObject } = await import("@/lib/api");
    const { blob, filename } = await downloadStorageObject(key);
    const file = new File([blob], filename || "template.docx", {
      type:
        blob.type ||
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    await putBlob(docId, file);
    return file;
  } catch {
    return null;
  }
}

export async function saveDocDataFile(docId: string, file: File): Promise<void> {
  await putBlob(`data:${docId}`, file);
  try {
    const { uploadStorageObject } = await import("@/lib/api");
    const up = await uploadStorageObject(file, { docId, kind: "data" });
    const store = loadStore();
    const idx = store.documents.findIndex((d) => d.id === docId);
    if (idx >= 0) {
      store.documents[idx] = {
        ...store.documents[idx],
        dataFileStorageKey: up.key,
        updatedAt: new Date().toISOString(),
      };
      saveStore(store);
    }
  } catch {
    /* offline */
  }
}

export async function loadDocDataFile(docId: string): Promise<File | null> {
  const local = await getBlob(
    `data:${docId}`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  if (local) return local;
  const doc = getDocument(docId);
  const key = doc?.dataFileStorageKey;
  if (!key) return null;
  try {
    const { downloadStorageObject } = await import("@/lib/api");
    const { blob, filename } = await downloadStorageObject(key);
    const file = new File([blob], filename || "data.xlsx", {
      type:
        blob.type ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await putBlob(`data:${docId}`, file);
    return file;
  } catch {
    return null;
  }
}

async function putBlob(key: string, file: File): Promise<void> {
  const buffer = await file.arrayBuffer();
  const db = await openDocsDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(BLOB_STORE, "readwrite");
    tx.objectStore(BLOB_STORE).put(
      {
        name: file.name,
        type: file.type || "application/octet-stream",
        buffer,
      },
      key,
    );
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
  });
  db.close();
}

async function getBlob(
  key: string,
  fallbackType: string,
): Promise<File | null> {
  const db = await openDocsDb();
  const record = await new Promise<{
    name: string;
    type: string;
    buffer: ArrayBuffer;
  } | null>((resolve, reject) => {
    const tx = db.transaction(BLOB_STORE, "readonly");
    const req = tx.objectStore(BLOB_STORE).get(key);
    req.onsuccess = () => {
      resolve(
        (req.result as {
          name: string;
          type: string;
          buffer: ArrayBuffer;
        }) ?? null,
      );
    };
    req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
  });
  db.close();
  if (!record?.buffer) return null;
  return new File([record.buffer], record.name, {
    type: record.type || fallbackType,
  });
}

async function deleteDocTemplate(docId: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDocsDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(BLOB_STORE, "readwrite");
    const store = tx.objectStore(BLOB_STORE);
    store.delete(docId);
    store.delete(`data:${docId}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB delete failed"));
  });
  db.close();
}
