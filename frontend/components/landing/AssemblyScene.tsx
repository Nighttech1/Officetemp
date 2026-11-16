"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import assemblyConfig from "@/content/assembly-figures.json";
import { resolveFigures } from "./assembly/figures";
import type { AssemblyConfig, AssemblyFigure } from "./assembly/types";

const config = assemblyConfig as AssemblyConfig;

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isMobileViewport() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(max-width: 767px)").matches;
}

function shade(hex: string, percent: number) {
  const n = hex.replace("#", "");
  const num = parseInt(n.length === 3 ? n.split("").map((c) => c + c).join("") : n, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(2.55 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(2.55 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(2.55 * percent)));
  return `rgb(${r},${g},${b})`;
}

function ClayFigure({
  figure,
  canvasW,
  canvasH,
}: {
  figure: AssemblyFigure;
  canvasW: number;
  canvasH: number;
}) {
  const w = figure.w ?? 120;
  const h = figure.h ?? 120;
  const left = `${(figure.x / canvasW) * 100}%`;
  const top = `${(figure.y / canvasH) * 100}%`;
  const box: CSSProperties = {
    width: `${(w / canvasW) * 100}%`,
    height: `${(h / canvasH) * 100}%`,
    left,
    top,
  };

  const data = {
    "data-assembly-figure": figure.id,
    "data-sx": figure.scatter.x,
    "data-sy": figure.scatter.y,
    "data-srot": figure.scatter.rot,
    "data-delay": figure.delay,
    "data-trot": figure.rot,
    "data-tscale": figure.scale,
  };

  const common = "assembly-fig assembly-clay absolute origin-center will-change-transform";
  const c = figure.color;
  const light = shade(c, 28);
  const dark = shade(c, -22);

  if (figure.type === "cone") {
    return (
      <div className={common} style={box} {...data}>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${light} 0%, ${c} 42%, ${dark} 100%)`,
            clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
            filter: "drop-shadow(0 14px 18px rgba(17,17,17,0.14))",
          }}
        />
        <div
          className="pointer-events-none absolute left-[42%] top-[18%] h-[28%] w-[18%] rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.75) 0%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  if (figure.type === "ring") {
    return (
      <div className={common} style={box} {...data}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 210deg, ${light}, ${c}, ${dark}, ${c}, ${light})`,
            boxShadow: "0 16px 28px rgba(17,17,17,0.12)",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 18%), #000 calc(100% - 17%))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 18%), #000 calc(100% - 17%))",
          }}
        />
        <div
          className="pointer-events-none absolute left-[18%] top-[12%] h-[22%] w-[30%] rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.85) 0%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  if (figure.type === "cylinder") {
    return (
      <div className={common} style={box} {...data}>
        <div
          className="absolute inset-x-[6%] bottom-[8%] top-[14%] rounded-[40%]"
          style={{
            background: `linear-gradient(90deg, ${dark} 0%, ${c} 35%, ${light} 55%, ${c} 78%, ${dark} 100%)`,
            boxShadow: "0 18px 28px rgba(17,17,17,0.14)",
          }}
        />
        <div
          className="absolute left-[6%] right-[6%] top-0 h-[28%]"
          style={{
            borderRadius: "50%",
            background: `radial-gradient(ellipse at 35% 35%, ${light} 0%, ${c} 55%, ${dark} 100%)`,
            boxShadow: "inset 0 -4px 10px rgba(0,0,0,0.12)",
          }}
        />
        <div
          className="pointer-events-none absolute left-[22%] top-[8%] h-[12%] w-[28%] rounded-full opacity-80"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  if (figure.type === "bar") {
    return (
      <div className={common} style={box} {...data}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(180deg, ${light} 0%, ${c} 45%, ${dark} 100%)`,
            boxShadow:
              "0 12px 22px rgba(17,17,17,0.14), inset 0 2px 4px rgba(255,255,255,0.35)",
          }}
        />
        <div
          className="pointer-events-none absolute left-[18%] top-[18%] h-[40%] w-[55%] rounded-full opacity-55"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.75), transparent)",
          }}
        />
      </div>
    );
  }

  // disc | capsule | default
  const radius = figure.type === "capsule" ? "9999px" : "9999px";
  const isAccent = figure.type === "capsule" && c.toLowerCase().includes("22c55e");

  return (
    <div className={common} style={box} {...data}>
      <div
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          background: isAccent
            ? `radial-gradient(circle at 32% 28%, #99f6e4 0%, ${c} 42%, #0f766e 100%)`
            : `radial-gradient(circle at 32% 28%, ${light} 0%, ${c} 48%, ${dark} 100%)`,
          boxShadow: isAccent
            ? "0 16px 32px rgba(34,197,94,0.45), inset -10px -14px 22px rgba(0,0,0,0.18)"
            : "0 16px 28px rgba(17,17,17,0.14), inset -10px -14px 22px rgba(0,0,0,0.14), inset 8px 10px 18px rgba(255,255,255,0.28)",
        }}
      />
      <div
        className="pointer-events-none absolute left-[18%] top-[14%] h-[34%] w-[38%] rounded-full opacity-75"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, transparent 68%)",
        }}
      />
    </div>
  );
}

type Props = { className?: string };

/** Editable clay assembling figures — config: `frontend/content/assembly-figures.json` */
export function AssemblyScene({ className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [lite, setLite] = useState(false);
  const figures = useMemo(() => resolveFigures(config, lite), [lite]);
  const { width, height } = config.canvas;

  useEffect(() => {
    setLite(isMobileViewport());
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-assembly-figure]");
    if (!nodes.length) return;

    const scaleX = () => root.clientWidth / width;
    const scaleY = () => root.clientHeight / height;

    const applyAssembled = (node: HTMLElement) => {
      gsap.set(node, {
        x: 0,
        y: 0,
        rotate: Number(node.dataset.trot ?? 0),
        scale: Number(node.dataset.tscale ?? 1),
        opacity: 1,
        xPercent: -50,
        yPercent: -50,
      });
    };

    if (prefersReducedMotion()) {
      nodes.forEach(applyAssembled);
      return;
    }

    const ctx = gsap.context(() => {
      nodes.forEach((node) => {
        const sx = Number(node.dataset.sx ?? 0) * scaleX();
        const sy = Number(node.dataset.sy ?? 0) * scaleY();
        const srot = Number(node.dataset.srot ?? 0);
        const trot = Number(node.dataset.trot ?? 0);
        const tscale = Number(node.dataset.tscale ?? 1);
        const delay = Number(node.dataset.delay ?? 0);

        gsap.fromTo(
          node,
          {
            x: sx,
            y: sy,
            rotate: trot + srot,
            scale: tscale * 0.7,
            opacity: 0.35,
            xPercent: -50,
            yPercent: -50,
          },
          {
            x: 0,
            y: 0,
            rotate: trot,
            scale: tscale,
            opacity: 1,
            duration: 1.4,
            delay,
            ease: "power3.out",
          },
        );
      });

      gsap.to(nodes, {
        y: "+=6",
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        stagger: { each: 0.14, from: "random" },
        delay: 1.7,
      });
    }, root);

    return () => ctx.revert();
  }, [figures, width, height]);

  return (
    <div
      ref={rootRef}
      className={`assembly-scene relative w-full ${className || "max-w-[min(100%,720px)]"}`}
      aria-hidden
      data-assembly-root
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <div className="absolute inset-0 overflow-visible">
        {figures.map((fig) => (
          <ClayFigure
            key={fig.id}
            figure={fig}
            canvasW={width}
            canvasH={height}
          />
        ))}
      </div>
    </div>
  );
}
