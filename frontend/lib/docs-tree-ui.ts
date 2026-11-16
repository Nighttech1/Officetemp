/** Общее UI-состояние дерева ИУЛ ↔ Накладные (C-223). */

const UI_KEY = "docsaas_tree_ui_v1";

export type DocsTreeUiState = {
  projectId: string | null;
  folderId: string | null;
  lastIulDocId: string | null;
  lastWaybillDocId: string | null;
};

const empty: DocsTreeUiState = {
  projectId: null,
  folderId: null,
  lastIulDocId: null,
  lastWaybillDocId: null,
};

export function loadDocsTreeUi(): DocsTreeUiState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = sessionStorage.getItem(UI_KEY);
    if (!raw) return empty;
    const p = JSON.parse(raw) as Partial<DocsTreeUiState>;
    return {
      projectId: typeof p.projectId === "string" ? p.projectId : null,
      folderId: typeof p.folderId === "string" ? p.folderId : null,
      lastIulDocId: typeof p.lastIulDocId === "string" ? p.lastIulDocId : null,
      lastWaybillDocId:
        typeof p.lastWaybillDocId === "string" ? p.lastWaybillDocId : null,
    };
  } catch {
    return empty;
  }
}

export function saveDocsTreeUi(patch: Partial<DocsTreeUiState>): void {
  if (typeof window === "undefined") return;
  try {
    const prev = loadDocsTreeUi();
    const next: DocsTreeUiState = { ...prev, ...patch };
    sessionStorage.setItem(UI_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
