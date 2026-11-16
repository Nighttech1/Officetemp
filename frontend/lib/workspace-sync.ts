/**
 * Dual-write: PostgreSQL (source of truth) ↔ localStorage mirror.
 * Word/Excel binaries → server storage keys; IndexedDB is cache.
 * Source PDFs for ИУЛ are never synced (policy 6.3.5).
 */

import {
  downloadStorageObject,
  fetchWorkspaceSnapshot,
  putWorkspaceSnapshot,
  type WorkspaceSnapshot,
} from "@/lib/api";
import {
  loadStore as loadDocsStore,
  saveStore as saveDocsStore,
  migrateWorkspaceFolders,
  type DocsStore,
  type DocItem,
  type Project,
} from "@/lib/docs-store";
// Подписи вынесены в отдельную ГЛОБАЛЬНУЮ библиотеку (lib/signature-sync):
// org-снапшот их больше не хранит и не затирает.

const SYNC_FLAG = "docsaas_workspace_synced_v1";
const REV_KEY = "docsaas_workspace_server_rev_v1";

function buildLocalSnapshot(): WorkspaceSnapshot {
  const docs = loadDocsStore();
  const revRaw =
    typeof sessionStorage !== "undefined" ? sessionStorage.getItem(REV_KEY) : null;
  const revision = revRaw ? Number(revRaw) || 0 : 0;
  return {
    projects: docs.projects.map((p) => ({
      id: p.id,
      kind: p.kind,
      name: p.name,
      createdAt: p.createdAt,
      iulSignSettings: p.iulSignSettings ?? null,
    })),
    folders: docs.folders.map((f) => ({
      id: f.id,
      projectId: f.projectId,
      parentId: f.parentId,
      name: f.name,
      systemKey: f.systemKey ?? null,
      createdAt: f.createdAt,
    })),
    documents: docs.documents.map((d: DocItem) => ({
      id: d.id,
      projectId: d.projectId,
      folderId: d.folderId,
      kind: d.kind,
      title: d.title,
      version: d.version,
      parentId: d.parentId,
      status: d.status,
      // Тяжёлый реестр накладной (wizard.rows) не гоняем на сервер — он выводится
      // из файла данных (он синкается) и хранится локально в IndexedDB.
      wizard: (d.wizard
        ? { ...d.wizard, rows: [] }
        : d.wizard) as unknown as Record<string, unknown>,
      iulWizard: (d.iulWizard as unknown as Record<string, unknown>) ?? null,
      templateStorageKey: d.templateStorageKey ?? null,
      dataFileStorageKey: d.dataFileStorageKey ?? null,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })),
    // Подписи больше не часть org-снапшота — у них своя глобальная библиотека.
    signatureFolders: [],
    signatures: [],
    revision,
  };
}

function settingsUseful(
  s: Project["iulSignSettings"] | null | undefined,
): s is NonNullable<Project["iulSignSettings"]> {
  if (!s) return false;
  return Boolean(
    (s.fixedRoles && s.fixedRoles.length > 0) ||
      s.overflowRole ||
      s.defaultHashAlgo,
  );
}

async function hydrateBlobsFromServer(docs: DocItem[]): Promise<void> {
  const { putBlobFromFile } = await import("@/lib/docs-blob-hydrate");
  for (const d of docs) {
    if (d.templateStorageKey) {
      try {
        const { blob, filename } = await downloadStorageObject(d.templateStorageKey);
        const file = new File([blob], filename || "template.docx", {
          type:
            blob.type ||
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        await putBlobFromFile(d.id, file);
      } catch {
        /* missing object — metadata still useful */
      }
    }
    if (d.dataFileStorageKey) {
      try {
        const { blob, filename } = await downloadStorageObject(d.dataFileStorageKey);
        const file = new File([blob], filename || "data.xlsx", {
          type:
            blob.type ||
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        await putBlobFromFile(`data:${d.id}`, file);
      } catch {
        /* skip */
      }
    }
  }
}

function applySnapshotToLocal(snap: WorkspaceSnapshot): DocItem[] {
  // C-93: не затираем локальные iulSignSettings, если сервер пустой/ещё без поля.
  const prev = loadDocsStore();
  const prevSettings = new Map(
    prev.projects.map((p) => [p.id, p.iulSignSettings] as const),
  );
  const documents: DocItem[] = snap.documents.map((d) => {
    const wiz = d.wizard as DocItem["wizard"];
    const fromWizard =
      typeof d.wizard === "object" && d.wizard
        ? (d.wizard as Record<string, unknown>)
        : {};
    return {
      id: d.id,
      projectId: d.projectId,
      folderId: d.folderId,
      kind: d.kind,
      title: d.title,
      version: d.version,
      parentId: d.parentId,
      status: d.status,
      wizard: wiz,
      iulWizard: (d.iulWizard as DocItem["iulWizard"]) ?? undefined,
      templateStorageKey:
        d.templateStorageKey ||
        (typeof fromWizard.templateStorageKey === "string"
          ? fromWizard.templateStorageKey
          : undefined),
      dataFileStorageKey:
        d.dataFileStorageKey ||
        (typeof fromWizard.dataFileStorageKey === "string"
          ? fromWizard.dataFileStorageKey
          : undefined),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  });
  const next: DocsStore = {
    projects: snap.projects.map((p) => {
      const remote = (
        p as { iulSignSettings?: Project["iulSignSettings"] | null }
      ).iulSignSettings;
      const local = prevSettings.get(p.id);
      return {
        id: p.id,
        kind: p.kind,
        name: p.name,
        createdAt: p.createdAt,
        iulSignSettings: settingsUseful(remote)
          ? remote
          : settingsUseful(local)
            ? local
            : (remote ?? local),
      };
    }),
    folders: snap.folders.map((f) => ({
      id: f.id,
      projectId: f.projectId,
      parentId: f.parentId,
      name: f.name,
      systemKey:
        f.systemKey === "signatures" ||
        f.systemKey === "iul" ||
        f.systemKey === "waybills"
          ? f.systemKey
          : undefined,
      createdAt: f.createdAt,
    })),
    documents,
  };
  migrateWorkspaceFolders(next);
  saveDocsStore(next);
  // Подписи не трогаем — их держит отдельная глобальная библиотека.
  // Страницы кабинета (накладные/ИУЛ) перепривязывают projectId/docId —
  // иначе после pull остаётся «ghost» id и мастер перестаёт сохранять шаги.
  try {
    window.dispatchEvent(
      new CustomEvent("docsaas:workspace-changed", {
        detail: { source: "pull", documentCount: documents.length },
      }),
    );
  } catch {
    /* ignore */
  }
  return documents;
}

/**
 * После входа: если сервер пуст — залить локальные данные;
 * иначе — скачать сервер и перезаписать LS (сервер — правда) + гидратация файлов.
 */
export async function syncWorkspaceOnLogin(): Promise<{
  ok: boolean;
  mode: "pull" | "migrate" | "skip" | "error";
  detail?: string;
}> {
  if (typeof window === "undefined") {
    return { ok: false, mode: "skip" };
  }
  try {
    const remote = await fetchWorkspaceSnapshot();
    const local = buildLocalSnapshot();
    const localHas =
      local.projects.length > 0 ||
      local.documents.length > 0 ||
      local.signatures.length > 0;

    if (remote.empty && localHas) {
      const put = await putWorkspaceSnapshot(local, true);
      sessionStorage.setItem(SYNC_FLAG, "migrated");
      sessionStorage.setItem(REV_KEY, String(put.server_revision));
      return { ok: true, mode: "migrate" };
    }

    if (!remote.empty) {
      const docs = applySnapshotToLocal(remote.snapshot);
      sessionStorage.setItem(SYNC_FLAG, "pulled");
      sessionStorage.setItem(REV_KEY, String(remote.server_revision));
      void hydrateBlobsFromServer(docs);
      // applySnapshotToLocal уже шлёт docsaas:workspace-changed
      return { ok: true, mode: "pull" };
    }

    sessionStorage.setItem(SYNC_FLAG, "empty");
    sessionStorage.setItem(REV_KEY, "0");
    return { ok: true, mode: "skip" };
  } catch (e) {
    const detail = e instanceof Error ? e.message : "sync failed";
    return { ok: false, mode: "error", detail };
  }
}

/** Debounced push после локальных правок (вызывать из UI при save). */
let pushTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleWorkspacePush(delayMs = 1200): void {
  if (typeof window === "undefined") return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    const snap = buildLocalSnapshot();
    const expected = snap.revision || null;
    void putWorkspaceSnapshot(snap, false, expected)
      .then((res) => {
        sessionStorage.setItem(REV_KEY, String(res.server_revision));
      })
      .catch((err) => {
        // 409 revision conflict → pull server truth next login; keep LS
        if (err && typeof err === "object" && "status" in err && err.status === 409) {
          sessionStorage.setItem(SYNC_FLAG, "conflict");
        }
      });
  }, delayMs);
}
