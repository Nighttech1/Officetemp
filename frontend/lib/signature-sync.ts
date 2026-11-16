/**
 * Синхронизация глобальной библиотеки подписей с сервером.
 * Сервер (`/signatures/library`) — источник правды, localStorage — кэш.
 * Библиотека одна на все аккаунты и грузится на старте приложения.
 */

import {
  fetchSignatureLibrary,
  putSignatureLibrary,
  type SignatureLibraryDTO,
} from "@/lib/api";
import {
  dumpSignatureLibrary,
  replaceSignatureLibrary,
} from "@/lib/signature-library";

const REV_KEY = "docsaas_sign_lib_server_rev_v1";

function toDTO(): SignatureLibraryDTO {
  const store = dumpSignatureLibrary();
  const revRaw =
    typeof sessionStorage !== "undefined" ? sessionStorage.getItem(REV_KEY) : null;
  return {
    folders: store.folders.map((f) => ({
      id: f.id,
      parentId: f.parentId,
      name: f.name,
      createdAt: f.createdAt,
    })),
    entries: store.entries.map((e) => ({
      id: e.id,
      folderId: e.folderId,
      surname: e.surname,
      imageDataUrl: e.imageDataUrl,
      createdAt: e.createdAt,
    })),
    revision: revRaw ? Number(revRaw) || 0 : 0,
  };
}

function notifyChanged(): void {
  try {
    window.dispatchEvent(new CustomEvent("docsaas:signatures-changed"));
  } catch {
    /* ignore */
  }
}

/**
 * Загрузить общую библиотеку с сервера (вызывать на старте, после dev-сессии).
 * Если сервер пуст, а локально что-то есть — один раз заливаем локальное.
 */
export async function loadGlobalSignatureLibrary(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const remote = await fetchSignatureLibrary();
    const local = dumpSignatureLibrary();
    const localHas = local.entries.length > 0 || local.folders.length > 0;

    if (remote.empty && localHas) {
      const put = await putSignatureLibrary(toDTO(), true);
      sessionStorage.setItem(REV_KEY, String(put.server_revision));
      return;
    }

    replaceSignatureLibrary({
      folders: remote.library.folders.map((f) => ({
        id: f.id,
        parentId: f.parentId,
        name: f.name,
        createdAt: f.createdAt,
      })),
      entries: remote.library.entries.map((e) => ({
        id: e.id,
        folderId: e.folderId,
        surname: e.surname,
        imageDataUrl: e.imageDataUrl || "",
        createdAt: e.createdAt,
      })),
    });
    sessionStorage.setItem(REV_KEY, String(remote.server_revision));
    notifyChanged();
  } catch {
    /* offline — работаем с локальным кэшем */
  }
}

/** Debounced push после локальных правок (вызывается из signature-library). */
let pushTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSignaturePush(delayMs = 1200): void {
  if (typeof window === "undefined") return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    const dto = toDTO();
    const expected = dto.revision || null;
    void putSignatureLibrary(dto, false, expected)
      .then((res) => {
        sessionStorage.setItem(REV_KEY, String(res.server_revision));
      })
      .catch(() => {
        /* 409/offline → подтянем правду при следующей загрузке */
      });
  }, delayMs);
}
