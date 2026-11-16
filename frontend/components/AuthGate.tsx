"use client";

import { useEffect, useState } from "react";
import { clearToken, ensureDevSession } from "@/lib/api";
import { syncWorkspaceOnLogin } from "@/lib/workspace-sync";
import { loadGlobalSignatureLibrary } from "@/lib/signature-sync";

/**
 * Кабинет открыт сразу: auth в фоне, без блокирующего «Подключаем кабинет…».
 * При недоступном API — янтарный баннер, локальные данные доступны.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [authHint, setAuthHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        clearToken();
        const ok = await Promise.race([
          ensureDevSession(),
          new Promise<boolean>((resolve) =>
            setTimeout(() => resolve(false), 3500),
          ),
        ]);
        if (cancelled) return;
        if (!ok) {
          setAuthHint(
            "API пока недоступен — работаем с локальными данными. Для генерации DOCX нужен бэкенд на :8005 (прокси /api через Next).",
          );
          return;
        }
        void syncWorkspaceOnLogin().catch(() => undefined);
        // Общая библиотека подписей — одна на все аккаунты, грузим всегда.
        void loadGlobalSignatureLibrary().catch(() => undefined);
      } catch {
        if (!cancelled) {
          setAuthHint("Ошибка входа в API — локальные данные доступны.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {authHint ? (
        <div
          className="mx-auto mb-3 max-w-3xl rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
          role="status"
        >
          {authHint}
        </div>
      ) : null}
      {children}
    </>
  );
}
