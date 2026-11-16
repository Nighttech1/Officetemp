"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: ReactNode;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isMobileViewport() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(max-width: 767px)").matches;
}

export function LandingMotion({ children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = prefersReducedMotion();
    let lenis: Lenis | null = null;
    let rafId = 0;
    let safetyTimer = 0;

    const revealAll = () => {
      root.querySelectorAll<HTMLElement>(".landing-reveal").forEach((el) => {
        el.style.opacity = "1";
        el.style.visibility = "visible";
        el.style.transform = "none";
      });
      root
        .querySelectorAll<HTMLElement>(".landing-hero-line-inner")
        .forEach((el) => {
          el.style.transform = "none";
        });
    };

    revealAll();
    safetyTimer = window.setTimeout(revealAll, 100);

    if (reduced) {
      return () => {
        window.clearTimeout(safetyTimer);
      };
    }

    const mobile = isMobileViewport();

    const ctx = gsap.context(() => {
      if (!mobile) {
        lenis = new Lenis({
          lerp: 0.1,
          smoothWheel: true,
        });
        lenis.on("scroll", ScrollTrigger.update);
        const raf = (time: number) => {
          lenis?.raf(time);
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);
      }

      // Hero split lines (Dayos rhythm)
      const lines = root.querySelectorAll<HTMLElement>(
        ".landing-hero-line-inner",
      );
      if (lines.length) {
        gsap.fromTo(
          lines,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 0.9,
            stagger: 0.08,
            ease: "power3.out",
            delay: 0.06,
          },
        );
      }

      gsap.fromTo(
        ".landing-hero .landing-reveal",
        { y: 18 },
        {
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power2.out",
          delay: 0.12,
          clearProps: "transform",
          immediateRender: false,
        },
      );

      gsap.utils
        .toArray<HTMLElement>(".landing-section .landing-reveal")
        .forEach((el) => {
          gsap.fromTo(
            el,
            { y: 22 },
            {
              y: 0,
              duration: 0.55,
              ease: "power2.out",
              immediateRender: false,
              clearProps: "transform",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                toggleActions: "play none none none",
                invalidateOnRefresh: true,
              },
            },
          );
        });

      // Rounded section soft scale-in
      gsap.utils
        .toArray<HTMLElement>(".landing-rounded-inner")
        .forEach((el) => {
          gsap.fromTo(
            el,
            { borderRadius: "0px" },
            {
              borderRadius: "2.5rem",
              ease: "none",
              scrollTrigger: {
                trigger: el.parentElement,
                start: "top 85%",
                end: "top 35%",
                scrub: true,
              },
            },
          );
        });

      // C-184: marquee circulates via CSS — не дублируем GSAP (иначе шов/дыра)
      ScrollTrigger.refresh();
      revealAll();
    }, root);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(safetyTimer);
      if (rafId) cancelAnimationFrame(rafId);
      lenis?.destroy();
      ctx.revert();
      revealAll();
    };
  }, []);

  return (
    <div ref={rootRef} className="landing-root">
      {children}
    </div>
  );
}
