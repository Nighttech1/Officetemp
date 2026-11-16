"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";
import { DocumentsMenu } from "@/components/docs/DocumentsMenu";
import { Button } from "./Button";

export function AppNav() {
  const router = useRouter();

  function logout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[rgba(9,9,11,0.72)] backdrop-blur-md supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/app/documents/waybills"
            className="font-display text-xl font-semibold text-brand"
          >
            DocSaaS
          </Link>
          <Button
            variant="ghost"
            className="sm:hidden"
            onClick={logout}
            aria-label="Выйти"
          >
            Выйти
          </Button>
        </div>
        <nav className="flex flex-wrap items-center gap-1" aria-label="Разделы кабинета">
          <DocumentsMenu variant="app" />
          <Link
            href="/contact"
            className="inline-flex min-h-touch items-center justify-center rounded-xl px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Контакты
          </Link>
          <Button
            variant="secondary"
            className="ml-auto hidden sm:inline-flex"
            onClick={logout}
          >
            Выйти
          </Button>
        </nav>
      </div>
    </header>
  );
}
