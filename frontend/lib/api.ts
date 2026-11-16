/**
 * API client for Doc SaaS backend.
 *
 * В браузере по умолчанию — same-origin (`""`), запросы идут на `/api/v1/...`
 * через Next rewrite (см. next.config.ts) → бэкенд. Так нет CORS и меньше
 * «Failed to fetch» при прямом обращении к :8005.
 *
 * Прямой URL: NEXT_PUBLIC_API_URL=http://127.0.0.1:8005 (отладка).
 */

const TOKEN_KEY = "docsaas_access_token";

export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw === "same" || raw === "/" || raw === ".") {
    return "";
  }
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  // Default: browser → same-origin proxy; SSR → direct backend.
  if (typeof window !== "undefined") {
    return "";
  }
  return (
    process.env.API_PROXY_TARGET?.trim().replace(/\/$/, "") ||
    "http://127.0.0.1:8005"
  );
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Пока кабинет открыт без обязательного логина — сам получаем JWT,
 * иначе /templates/analyze и /data/excel отвечают «Not authenticated».
 */
export async function ensureDevSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const existing = getToken();
  if (existing) {
    try {
      await fetchMe();
      return true;
    } catch {
      clearToken();
    }
  }

  const known = [
    { email: "admin1", password: "admin1" },
    { email: "admin2", password: "admin2" },
  ] as const;

  for (const creds of known) {
    try {
      const res = await login(creds);
      setToken(res.access_token);
      return true;
    } catch {
      // try next
    }
  }

  try {
    const res = await register({
      org_name: "DocSaaS Local",
      email: `local.dev.${Date.now()}@example.com`,
      password: "localdev1",
      full_name: "Local Tester",
      consent: true,
    });
    setToken(res.access_token);
    return true;
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let detail = res.statusText || "Ошибка запроса";
  try {
    const data = (await res.json()) as { detail?: unknown };
    if (typeof data.detail === "string") {
      detail = data.detail;
    } else if (Array.isArray(data.detail)) {
      detail = data.detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }
          return JSON.stringify(item);
        })
        .join("; ");
    } else if (data.detail != null) {
      detail = JSON.stringify(data.detail);
    }
  } catch {
    // keep statusText
  }
  return new ApiError(res.status, detail);
}

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

/** JSON request (GET/POST/PUT). Returns parsed JSON. */
export async function apiJson<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    auth?: boolean;
  } = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers = auth ? authHeaders() : new Headers();
  headers.set("Accept", "application/json");
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw networkApiError(err, path);
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/** Multipart upload. Do not set Content-Type — browser sets boundary. */
export async function apiMultipart<T>(
  path: string,
  formData: FormData,
  options: { method?: string; auth?: boolean } = {},
): Promise<T> {
  const { method = "POST", auth = true } = options;
  const headers = auth ? authHeaders() : new Headers();
  headers.set("Accept", "application/json");

  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${path}`, {
      method,
      headers,
      body: formData,
    });
  } catch (err) {
    throw networkApiError(err, path);
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  return (await res.json()) as T;
}

/** Сетевой сбой fetch (CORS / API выключен / неверный порт) → понятный текст. */
function networkApiError(err: unknown, path: string): ApiError {
  const base = getApiBase();
  const msg =
    err instanceof Error && err.message
      ? err.message
      : String(err ?? "network error");
  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(msg)) {
    return new ApiError(
      0,
      `Нет связи с API (${base || "(сайт)"}${path}). Обновите страницу (Ctrl+F5). Если не помогло — бэкенд на порту 8005 не запущен. Сырая ошибка: ${msg}`,
    );
  }
  return new ApiError(0, msg);
}

/** Multipart that returns a binary blob (DOCX/PDF download). */
export async function apiMultipartBlob(
  path: string,
  formData: FormData,
  options: { method?: string; auth?: boolean } = {},
): Promise<{ blob: Blob; filename: string }> {
  const { method = "POST", auth = true } = options;
  if (auth) {
    const ok = await ensureDevSession();
    if (!ok && !getToken()) {
      throw new ApiError(
        401,
        "Нет входа в API. Обновите страницу — кабинет должен подключиться сам.",
      );
    }
  }
  const headers = auth ? authHeaders() : new Headers();

  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${path}`, {
      method,
      headers,
      body: formData,
    });
  } catch (err) {
    throw networkApiError(err, path);
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  const plain = /filename="([^"]+)"/i.exec(disposition);
  let filename = "download.bin";
  if (star?.[1]) {
    try {
      filename = decodeURIComponent(star[1]);
    } catch {
      filename = star[1];
    }
  } else if (plain?.[1]) {
    filename = plain[1];
  }
  const blob = await res.blob();
  return { blob, filename };
}

// ——— Domain types ———

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type MeResponse = {
  id: string;
  organization_id: string;
  role: string;
  email: string;
  full_name: string;
  phone?: string | null;
  consent_at?: string | null;
  is_active: boolean;
};

export type TemplateOut = {
  id: string;
  organization_id: string;
  name: string;
  storage_key: string;
  created_by: string | null;
  created_at: string;
};

export type DatasetOut = {
  source: "excel" | "csv" | "google" | "yandex";
  columns: string[];
  rows: Record<string, unknown>[];
  meta: {
    row_count: number;
    fetched_at: string;
    extra?: Record<string, unknown>;
  };
};

export async function register(body: {
  org_name: string;
  email: string;
  password: string;
  full_name: string;
  consent: boolean;
  marketing_opt_in?: boolean;
}): Promise<TokenResponse> {
  return apiJson<TokenResponse>("/api/v1/auth/register", {
    method: "POST",
    body,
    auth: false,
  });
}

export async function login(body: {
  email: string;
  password: string;
}): Promise<TokenResponse> {
  return apiJson<TokenResponse>("/api/v1/auth/login", {
    method: "POST",
    body,
    auth: false,
  });
}

export type ForgotPasswordResponse = {
  ok: boolean;
  detail: string;
  debug_reset_url?: string | null;
};

export async function forgotPassword(body: {
  email: string;
}): Promise<ForgotPasswordResponse> {
  return apiJson<ForgotPasswordResponse>("/api/v1/auth/forgot-password", {
    method: "POST",
    body,
    auth: false,
  });
}

export async function resetPassword(body: {
  token: string;
  new_password: string;
}): Promise<{ ok: boolean; detail: string }> {
  return apiJson("/api/v1/auth/reset-password", {
    method: "POST",
    body,
    auth: false,
  });
}

export async function unsubscribeMarketing(body: {
  token: string;
}): Promise<{ ok: boolean; detail: string; unsubscribed: boolean }> {
  return apiJson("/api/v1/marketing/unsubscribe", {
    method: "POST",
    body,
    auth: false,
  });
}

export async function fetchMe(): Promise<MeResponse> {
  return apiJson<MeResponse>("/api/v1/auth/me");
}

export type WorkspaceSnapshot = {
  projects: Array<{
    id: string;
    kind: "waybill" | "info_sheet";
    name: string;
    createdAt: string;
    iulSignSettings?: {
      fixedRoles: string[];
      overflowRole: string;
      defaultHashAlgo?: "MD5" | "SHA-1" | "SHA-256" | "CRC32";
    } | null;
  }>;
  folders: Array<{
    id: string;
    projectId: string;
    parentId: string | null;
    name: string;
    systemKey?: "signatures" | "iul" | "waybills" | null;
    createdAt: string;
  }>;
  documents: Array<{
    id: string;
    projectId: string;
    folderId: string | null;
    kind: "waybill" | "info_sheet";
    title: string;
    version: number;
    parentId: string | null;
    status: "draft" | "ready";
    wizard: Record<string, unknown>;
    iulWizard?: Record<string, unknown> | null;
    templateStorageKey?: string | null;
    dataFileStorageKey?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  signatureFolders: Array<{
    id: string;
    projectId: string;
    parentId: string | null;
    name: string;
    createdAt: string;
  }>;
  signatures: Array<{
    id: string;
    projectId: string;
    folderId: string | null;
    surname: string;
    storageKey?: string;
    contentType?: string;
    imageDataUrl?: string | null;
    createdAt: string;
  }>;
  revision: number;
};

export type WorkspaceSnapshotResponse = {
  snapshot: WorkspaceSnapshot;
  server_revision: number;
  empty: boolean;
};

export async function fetchWorkspaceSnapshot(): Promise<WorkspaceSnapshotResponse> {
  return apiJson<WorkspaceSnapshotResponse>("/api/v1/workspace/snapshot");
}

export async function putWorkspaceSnapshot(
  snapshot: WorkspaceSnapshot,
  migrateLocal = false,
  expectedRevision?: number | null,
): Promise<{ ok: boolean; server_revision: number; imported: boolean }> {
  return apiJson("/api/v1/workspace/snapshot", {
    method: "PUT",
    body: {
      snapshot,
      migrate_local: migrateLocal,
      expected_revision:
        expectedRevision === undefined ? null : expectedRevision,
    },
  });
}

// ——— Global signature library (one shared set, account-independent) ———

export type SignatureLibraryDTO = {
  folders: Array<{
    id: string;
    parentId: string | null;
    name: string;
    createdAt: string;
  }>;
  entries: Array<{
    id: string;
    folderId: string | null;
    surname: string;
    imageDataUrl: string;
    createdAt: string;
  }>;
  revision: number;
};

export type SignatureLibraryResponse = {
  library: SignatureLibraryDTO;
  server_revision: number;
  empty: boolean;
};

export async function fetchSignatureLibrary(): Promise<SignatureLibraryResponse> {
  return apiJson<SignatureLibraryResponse>("/api/v1/signatures/library");
}

export async function putSignatureLibrary(
  library: SignatureLibraryDTO,
  migrateLocal = false,
  expectedRevision?: number | null,
): Promise<{ ok: boolean; server_revision: number; imported: boolean }> {
  return apiJson("/api/v1/signatures/library", {
    method: "PUT",
    body: {
      library,
      migrate_local: migrateLocal,
      expected_revision:
        expectedRevision === undefined ? null : expectedRevision,
    },
  });
}

export type StorageObjectOut = {
  key: string;
  bytes: number;
  backend: string;
  content_type?: string | null;
};

export async function uploadStorageObject(
  file: File,
  opts: { docId?: string; kind?: string } = {},
): Promise<StorageObjectOut> {
  const fd = new FormData();
  fd.append("file", file);
  if (opts.docId) fd.append("doc_id", opts.docId);
  fd.append("kind", opts.kind || "template");
  return apiMultipart<StorageObjectOut>("/api/v1/storage/objects", fd);
}

export async function downloadStorageObject(
  key: string,
): Promise<{ blob: Blob; filename: string }> {
  const headers = authHeaders();
  headers.set("Accept", "*/*");
  const q = encodeURIComponent(key);
  let res: Response;
  try {
    res = await fetch(`${getApiBase()}/api/v1/storage/objects?key=${q}`, {
      method: "GET",
      headers,
    });
  } catch (err) {
    throw networkApiError(err, "/api/v1/storage/objects");
  }
  if (!res.ok) {
    throw await parseError(res);
  }
  const blob = await res.blob();
  const parts = key.split("/");
  const filename = parts[parts.length - 1] || "download.bin";
  return { blob, filename };
}

export async function listTemplates(): Promise<TemplateOut[]> {
  return apiJson<TemplateOut[]>("/api/v1/templates");
}

export async function createTemplate(body: {
  name: string;
  storage_key: string;
}): Promise<TemplateOut> {
  return apiJson<TemplateOut>("/api/v1/templates", {
    method: "POST",
    body,
  });
}

export async function analyzeTemplate(
  file: File,
): Promise<{ tags: string[] }> {
  const fd = new FormData();
  fd.append("template", file);
  return apiMultipart<{ tags: string[] }>("/api/v1/templates/analyze", fd);
}

export type IulStampSignature = {
  role: string;
  surname: string;
  signed_at: string;
  signature_png_base64?: string | null;
};

export type IulStampAnalyze = {
  object_name: string;
  doc_designation: string;
  doc_name: string;
  doc_version: string;
  ul_code: string;
  signatures: IulStampSignature[];
  source_page: number | null;
  warnings: string[];
};

/** Разбор штампа чертежа PDF для автозаполнения ИУЛ. */
export async function analyzeIulPdf(
  file: File,
  options?: { extractSignatures?: boolean },
): Promise<IulStampAnalyze> {
  await ensureDevSession();
  const fd = new FormData();
  fd.append("file", file);
  fd.append(
    "extract_signatures",
    options?.extractSignatures === false ? "false" : "true",
  );
  return apiMultipart<IulStampAnalyze>("/api/v1/iul/analyze-pdf", fd);
}

export async function uploadExcel(
  file: File,
  sheetName?: string | null,
): Promise<DatasetOut> {
  await ensureDevSession();
  const fd = new FormData();
  fd.append("file", file);
  if (sheetName) fd.append("sheet_name", sheetName);
  return apiMultipart<DatasetOut>("/api/v1/data/excel", fd);
}

/** Подтянуть Google / Яндекс таблицу по ссылке (+ опционально лист). */
export async function fetchCloudTable(
  url: string,
  sheetName?: string | null,
): Promise<DatasetOut> {
  const t0 = Date.now();
  const ok = await ensureDevSession();
  // #region agent log
  fetch("http://127.0.0.1:7681/ingest/5f74e7af-cc2f-4b5f-8ca1-8fa8f20ea9e6", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "6cfa5a",
    },
    body: JSON.stringify({
      sessionId: "6cfa5a",
      runId: "post-fix",
      hypothesisId: "H5",
      location: "api.ts:fetchCloudTable",
      message: "session ready, posting from-url",
      data: {
        sessionOk: ok,
        hasToken: Boolean(getToken()),
        urlHost: (() => {
          try {
            return new URL(url.trim()).hostname;
          } catch {
            return "invalid";
          }
        })(),
        sheetName: sheetName ?? null,
        sessionMs: Date.now() - t0,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (!ok && !getToken()) {
    throw new ApiError(
      401,
      "Нет входа в API. Обновите страницу — кабинет должен подключиться сам.",
    );
  }
  return apiJson<DatasetOut>("/api/v1/data/from-url", {
    method: "POST",
    body: {
      url: url.trim(),
      sheet_name: sheetName?.trim() || null,
    },
  });
}

export async function generateDocx(
  template: File,
  context: Record<string, unknown>,
): Promise<{ blob: Blob; filename: string }> {
  await ensureDevSession();
  const fd = new FormData();
  fd.append("template", template);
  fd.append("context", JSON.stringify(context));
  return apiMultipartBlob("/api/v1/generate/docx", fd);
}

export async function generatePdf(
  template: File,
  context: Record<string, unknown>,
): Promise<{ blob: Blob; filename: string }> {
  await ensureDevSession();
  const fd = new FormData();
  fd.append("template", template);
  fd.append("context", JSON.stringify(context));
  return apiMultipartBlob("/api/v1/generate/pdf", fd);
}

export type ContactResponse = {
  ok: boolean;
  status: "stored" | "emailed" | "accepted";
};

export async function submitContact(body: {
  name: string;
  email: string;
  message: string;
  website?: string;
}): Promise<ContactResponse> {
  return apiJson<ContactResponse>("/api/v1/forms/contact", {
    method: "POST",
    body,
    auth: false,
  });
}
