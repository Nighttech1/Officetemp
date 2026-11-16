"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LoginPopover } from "./LoginPopover";
import { MegaNav } from "./MegaNav";

type NavTone = "grey" | "cream" | "dark";

/** C-163: на hero nav = landing-grey без линии шва */
export function LandingNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<NavTone>(isHome ? "grey" : "dark");

  useEffect(() => {
    const update = () => {
      if (!isHome) {
        setTone("dark");
        return;
      }
      if (window.scrollY < 8) {
        setTone("grey");
        return;
      }
      const y = window.scrollY + 56;
      const zones = document.querySelectorAll<HTMLElement>("[data-landing-theme]");
      let hit: NavTone = "dark";
      zones.forEach((el) => {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (y >= top && y < bottom) {
          const t = el.getAttribute("data-landing-theme");
          if (t === "grey") hit = "grey";
          else if (t === "cream" || t === "white") hit = "cream";
          else hit = "dark";
        }
      });
      setTone(hit);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isHome]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const light = (tone === "grey" || tone === "cream") && !open;

  const headerClass =
    open
      ? "border-b border-white/10 bg-landing-dark text-landing-cream"
      : tone === "grey"
        ? "border-b border-transparent bg-landing-grey text-landing-ink"
        : tone === "cream"
          ? "border-b border-transparent bg-landing-cream text-landing-ink"
          : "border-b border-white/10 bg-landing-dark/90 text-landing-cream backdrop-blur-md";

  const cabinetBtn =
    "inline-flex min-h-touch min-w-touch items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-landing-dark transition-colors hover:bg-brand-hover";

  return (
    <header
      className={`landing-nav sticky top-0 z-50 transition-[background,backdrop-filter,border-color,color] duration-300 ${headerClass}`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className={`shrink-0 font-display text-lg tracking-tight sm:text-xl ${
            light ? "text-landing-ink" : "text-landing-cream"
          }`}
        >
          DocSaaS
        </Link>

        <div className="hidden min-w-0 flex-1 md:flex">
          <MegaNav light={light} />
        </div>

        <div className="hidden shrink-0 items-center md:flex">
          <LoginPopover triggerClassName={cabinetBtn} light={light} />
        </div>

        <button
          type="button"
          className={`inline-flex min-h-touch min-w-touch items-center justify-center rounded-md border md:hidden ${
            light
              ? "border-landing-ink/20 text-landing-ink"
              : "border-white/15 text-landing-cream"
          }`}
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Закрыть" : "Меню"}</span>
          <span className="flex w-5 flex-col gap-1.5" aria-hidden>
            <span
              className={`h-px w-full bg-current transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`}
            />
            <span
              className={`h-px w-full bg-current transition-opacity ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`h-px w-full bg-current transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      <div
        id="landing-mobile-menu"
        className={`border-t border-white/10 bg-landing-dark md:hidden ${open ? "block" : "hidden"}`}
      >
        <nav
          className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4"
          aria-label="Мобильная навигация"
        >
          <MegaNav light={false} mobile onNavigate={() => setOpen(false)} />
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <LoginPopover triggerClassName={`${cabinetBtn} w-full`} light={false} />
          </div>
        </nav>
      </div>
    </header>
  );
}
