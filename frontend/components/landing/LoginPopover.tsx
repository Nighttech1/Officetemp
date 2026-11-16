"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, login, setToken } from "@/lib/api";

type Props = {
  triggerClassName: string;
  light?: boolean;
};

/** C-165: только логин + пароль, без заголовка/описания */
export function LoginPopover({ triggerClassName, light = false }: Props) {
  const router = useRouter();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clearTimers() {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }

  function scheduleOpen() {
    clearTimers();
    openTimer.current = setTimeout(() => setOpen(true), 120);
  }

  function scheduleClose() {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), 220);
  }

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ email: email.trim(), password });
      setToken(res.access_token);
      setOpen(false);
      router.push("/app/templates");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 401
            ? "Неверный логин или пароль"
            : err.detail
          : "Не удалось войти. Проверьте интернет и API.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const panelBg = light
    ? "border-landing-dark/15 bg-white text-landing-dark shadow-lg"
    : "border-white/15 bg-[#121211] text-landing-cream shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)]";

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={triggerClassName}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        Личный кабинет
      </button>

      <div
        id={panelId}
        role="dialog"
        aria-label="Вход в личный кабинет"
        className={`absolute right-0 top-full z-[60] w-[min(100vw-2rem,20rem)] origin-top-right pt-2 transition-[opacity,transform,visibility] duration-200 ease-out ${
          open
            ? "pointer-events-auto visible translate-y-0 scale-100 opacity-100"
            : "pointer-events-none invisible -translate-y-1 scale-[0.98] opacity-0"
        }`}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
      >
        <div className={`rounded-xl border p-4 ${panelBg}`}>
          <form className="flex flex-col gap-3" onSubmit={onSubmit}>
            <label className="block">
              <span
                className={`mb-1.5 block text-sm font-bold ${light ? "text-black" : "text-landing-cream"}`}
              >
                Логин
              </span>
              <input
                className={`field-control font-semibold ${light ? "!border-landing-dark/25 !bg-white !text-black placeholder:!text-landing-dark/40" : "font-semibold"}`}
                name="email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin1"
              />
            </label>
            <label className="block">
              <span
                className={`mb-1.5 block text-sm font-bold ${light ? "text-black" : "text-landing-cream"}`}
              >
                Пароль
              </span>
              <input
                className={`field-control font-semibold ${light ? "!border-landing-dark/25 !bg-white !text-black placeholder:!text-landing-dark/40" : "font-semibold"}`}
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin1"
              />
            </label>
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-touch w-full items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-landing-dark transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {loading ? "Входим…" : "Войти"}
            </button>
            <p className="text-center text-xs">
              <a
                href="/forgot-password"
                className={
                  light
                    ? "text-landing-dark/70 hover:underline"
                    : "text-landing-muted hover:text-brand hover:underline"
                }
              >
                Забыли пароль?
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
