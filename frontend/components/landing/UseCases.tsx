"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const CASES = [
  {
    title: "Накладные и комплекты",
    body: "Строки Excel → пакет DOCX/PDF с нумерацией и превью A4.",
    art: "waybill",
    href: "/app/documents/waybills",
  },
  {
    title: "ИУЛ и штампы",
    body: "Пакет из PDF: хэш, даты, библиотека подписей.",
    art: "iul",
    href: "/app/documents/info-sheet",
  },
  {
    title: "Договоры и акты",
    body: "Один Word-шаблон — сотни контрагентов, ZIP на выходе.",
    art: "contract",
    href: "/register",
  },
  {
    title: "Сертификаты",
    body: "Тысячи строк через очередь Celery без ручной сборки.",
    art: "cert",
    href: "/register",
  },
] as const;

function CaseArt({ kind }: { kind: (typeof CASES)[number]["art"] }) {
  if (kind === "waybill") {
    return (
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#2a2a28] p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.25),transparent_55%)]" />
        <div className="relative space-y-2 rounded-lg border border-white/10 bg-white/95 p-3 shadow-lg">
          <div className="h-2 w-1/3 rounded bg-brand/80" />
          <div className="h-1.5 w-full rounded bg-landing-ink/10" />
          <div className="h-1.5 w-5/6 rounded bg-landing-ink/10" />
          <div className="mt-2 grid grid-cols-3 gap-1">
            <div className="h-6 rounded bg-landing-ink/8" />
            <div className="h-6 rounded bg-landing-ink/8" />
            <div className="h-6 rounded bg-brand/20" />
          </div>
        </div>
      </div>
    );
  }
  if (kind === "iul") {
    return (
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-[#111] to-[#1f1f1d]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(34,197,94,0.2),transparent_50%)]" />
        <div className="relative h-28 w-20 -rotate-6 rounded-sm border border-white/20 bg-[#f7f7f5] shadow-xl">
          <div className="m-2 h-2 rounded bg-landing-ink/20" />
          <div className="mx-2 mt-3 h-10 rounded border border-dashed border-brand/50 bg-brand/10" />
          <div className="mx-2 mt-2 h-1.5 w-2/3 rounded bg-landing-ink/15" />
        </div>
        <div className="absolute right-6 top-8 h-24 w-16 rotate-6 rounded-sm border border-white/15 bg-white/90 shadow-lg" />
      </div>
    );
  }
  if (kind === "contract") {
    return (
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#0e0e0d] via-[#161614] to-[#1c2a20] p-5">
        <div className="space-y-2">
          {[0.9, 0.75, 0.85, 0.6].map((w, i) => (
            <div
              key={i}
              className="h-2 rounded bg-white/15"
              style={{ width: `${w * 100}%` }}
            />
          ))}
        </div>
        <div className="absolute bottom-4 right-4 rounded-full bg-brand px-3 py-1 text-[10px] font-semibold text-landing-dark">
          ZIP
        </div>
      </div>
    );
  }
  return (
    <div className="relative flex h-40 items-end justify-center gap-2 overflow-hidden bg-gradient-to-t from-[#0a0a0a] to-[#1a241c] px-6 pb-5">
      {[40, 70, 55, 85, 60].map((h, i) => (
        <div
          key={i}
          className="w-4 rounded-t bg-brand/70"
          style={{ height: `${h}%`, opacity: 0.45 + i * 0.1 }}
        />
      ))}
    </div>
  );
}

/**
 * C-176: «Услуги» — бесконечная лента с равным gap;
 * при hover только горизонталь (Lenis prevent + wheel lock);
 * wheel → velocity/friction (плавно, не дискретно).
 */
export function UseCases() {
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const velRef = useRef(0);
  const hoveringRef = useRef(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    hoveringRef.current = hovering;
  }, [hovering]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const autoSpeed = 0.4;
    const friction = 0.88;
    const tick = () => {
      // две половины loop [...CASES×2×1.5] → wrap по 1/3 ширины (одна копия CASES)
      const setW = el.scrollWidth / 3;
      if (Math.abs(velRef.current) > 0.02) {
        xRef.current += velRef.current;
        velRef.current *= friction;
      } else if (!hoveringRef.current) {
        velRef.current = 0;
        xRef.current -= autoSpeed;
      } else {
        velRef.current = 0;
      }
      if (setW > 0) {
        while (xRef.current <= -setW) xRef.current += setW;
        while (xRef.current > 0) xRef.current -= setW;
      }
      el.style.transform = `translate3d(${xRef.current}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY + e.deltaX;
      velRef.current += -delta * 0.18;
      const max = 28;
      if (velRef.current > max) velRef.current = max;
      if (velRef.current < -max) velRef.current = -max;
    };
    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", onWheel);
  }, []);

  // Три копии → шов цикла незаметен при равном gap без padding на треке
  const loop = [...CASES, ...CASES, ...CASES];

  return (
    <section
      className="landing-section landing-rounded-wrap bg-landing-cream text-landing-ink"
      data-landing-theme="white"
      id="use-cases"
      aria-labelledby="usecases-title"
    >
      <div className="landing-rounded-inner mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="landing-reveal max-w-2xl">
          <h2
            id="usecases-title"
            className="font-hero text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold tracking-tight"
          >
            Услуги
          </h2>
          <p className="mt-3 text-landing-ink/65">
            Наведите на ленту — страница не едет вниз, только горизонталь.
            Колёсико крутит плавно, без рывков.
          </p>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="landing-reveal relative overflow-hidden pb-16"
        data-lenis-prevent
        data-lenis-prevent-wheel
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false);
          velRef.current *= 0.5;
        }}
      >
        {/* gap только через flex gap — без padding на треке, иначе шов цикла «рвётся» */}
        <div
          ref={trackRef}
          className="flex w-max gap-4 will-change-transform"
          aria-label="Услуги DocSaaS"
        >
          {loop.map((c, i) => (
            <Link
              key={`${c.title}-${i}`}
              href={c.href}
              className="block w-[min(78vw,300px)] shrink-0 overflow-hidden rounded-3xl border border-landing-ink/10 bg-white shadow-[0_16px_48px_rgba(17,17,17,0.08)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_20px_56px_rgba(34,197,94,0.14)] sm:w-[300px]"
            >
              <article>
                <CaseArt kind={c.art} />
                <div className="p-5 sm:p-6">
                  <p className="font-mono text-[10px] tracking-widest text-landing-ink/35">
                    {String((i % CASES.length) + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1.5 font-display text-lg font-semibold">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-landing-ink/65">
                    {c.body}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-brand">
                    Открыть →
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
