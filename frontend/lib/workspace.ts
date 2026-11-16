/** Session workspace for mapper → generate flow (sessionStorage + IndexedDB). */

const SESSION_KEY = "docsaas_workspace_v1";
const DB_NAME = "docsaas_files";
const STORE = "blobs";
const TEMPLATE_BLOB_KEY = "active_template";

export type WorkspaceState = {
  /** Template display name */
  templateName: string;
  /** Tags from analyze */
  tags: string[];
  /** Excel/CSV columns */
  columns: string[];
  /** tag → column name */
  mapping: Record<string, string>;
  /** Parsed rows (for context build) */
  rows: Record<string, unknown>[];
  /** Source filename */
  dataFilename: string;
  /** Template id from library if selected */
  templateId: string | null;
  /** Row index used for single-doc generate */
  rowIndex: number;
  updatedAt: string;
};

export function emptyWorkspace(): WorkspaceState {
  return {
    templateName: "",
    tags: [],
    columns: [],
    mapping: {},
    rows: [],
    dataFilename: "",
    templateId: null,
    rowIndex: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function loadWorkspace(): WorkspaceState {
  if (typeof window === "undefined") return emptyWorkspace();
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return emptyWorkspace();
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    return { ...emptyWorkspace(), ...parsed };
  } catch {
    return emptyWorkspace();
  }
}

export function saveWorkspace(state: WorkspaceState): void {
  const next = { ...state, updatedAt: new Date().toISOString() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
}

export function buildContext(
  state: WorkspaceState,
  rowIndex = state.rowIndex,
): Record<string, unknown> {
  const row = state.rows[rowIndex] ?? {};
  const ctx: Record<string, unknown> = {};
  for (const [tag, column] of Object.entries(state.mapping)) {
    if (!column) continue;
    ctx[tag] = row[column] ?? "";
  }
  return ctx;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

export async function saveTemplateFile(file: File): Promise<void> {
  const buffer = await file.arrayBuffer();
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(
      {
        name: file.name,
        type:
          file.type ||
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer,
      },
      TEMPLATE_BLOB_KEY,
    );
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
  });
  db.close();
}

export async function loadTemplateFile(): Promise<File | null> {
  const db = await openDb();
  const record = await new Promise<{
    name: string;
    type: string;
    buffer: ArrayBuffer;
  } | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(TEMPLATE_BLOB_KEY);
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
    type:
      record.type ||
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

/** Cache analyzed tags per template id (localStorage). */
const TAGS_KEY = "docsaas_template_tags";

export function saveTemplateTags(templateId: string, tags: string[]): void {
  try {
    const map = JSON.parse(localStorage.getItem(TAGS_KEY) || "{}") as Record<
      string,
      string[]
    >;
    map[templateId] = tags;
    localStorage.setItem(TAGS_KEY, JSON.stringify(map));
  } catch {
    // ignore quota
  }
}

export function getTemplateTags(templateId: string): string[] {
  try {
    const map = JSON.parse(localStorage.getItem(TAGS_KEY) || "{}") as Record<
      string,
      string[]
    >;
    return map[templateId] ?? [];
  } catch {
    return [];
  }
}
