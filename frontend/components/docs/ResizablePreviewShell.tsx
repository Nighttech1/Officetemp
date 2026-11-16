"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const DEFAULT_W = 520;
const DEFAULT_H = 560;
const MIN_W = 280;
const MAX_W = 1100;
const MIN_H = 320;
const MAX_H = 900;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function readStored(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

/** Returns null when the user has never customized this preference. */
function readStoredOptional(key: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: number) {
  try {
    window.localStorage.setItem(key, String(Math.round(value)));
  } catch {
    /* ignore quota / private mode */
  }
}

type Props = {
  children: ReactNode;
  className?: string;
  /** e.g. "waybill" | "iul" — scopes localStorage keys */
  storageKeyPrefix: string;
};

/**
 * C-211: content-sized height; maxHeight only when user dragged to set one.
 * No default viewport clamp that forces a vertical scrollbar.
 */
export function ResizablePreviewShell({
  children,
  className,
  storageKeyPrefix,
}: Props) {
  const wKey = `docsaas_preview_w_${storageKeyPrefix}`;
  /** v2: ignore old clamped heights that forced inner scrollbars */
  const hKey = `docsaas_preview_fit_h_${storageKeyPrefix}`;

  const [width, setWidth] = useState(DEFAULT_W);
  /** null = height follows content; number = user preference via height drag */
  const [maxHeight, setMaxHeight] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const dragRef = useRef<{
    kind: "w" | "h";
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const widthRef = useRef(width);
  const maxHeightRef = useRef(maxHeight);
  const shellRef = useRef<HTMLDivElement>(null);
  widthRef.current = width;
  maxHeightRef.current = maxHeight;

  useEffect(() => {
    setWidth(clamp(readStored(wKey, DEFAULT_W), MIN_W, MAX_W));
    const storedH = readStoredOptional(hKey);
    setMaxHeight(
      storedH != null ? clamp(storedH, MIN_H, MAX_H) : null,
    );
    setHydrated(true);
  }, [wKey, hKey]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    if (d.kind === "w") {
      // Handle on LEFT edge: drag left → wider
      setWidth(clamp(d.startW + (d.startX - e.clientX), MIN_W, MAX_W));
    } else {
      setMaxHeight(clamp(d.startH + (e.clientY - d.startY), MIN_H, MAX_H));
    }
  }, []);

  const stopDrag = useCallback(() => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
    if (d.kind === "w") {
      writeStored(wKey, widthRef.current);
    } else if (maxHeightRef.current != null) {
      writeStored(hKey, maxHeightRef.current);
    }
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", stopDrag);
    window.removeEventListener("pointercancel", stopDrag);
  }, [onPointerMove, wKey, hKey]);

  function startDrag(kind: "w" | "h", e: ReactPointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const currentH =
      maxHeightRef.current ??
      Math.round(shellRef.current?.getBoundingClientRect().height ?? DEFAULT_H);
    dragRef.current = {
      kind,
      startX: e.clientX,
      startY: e.clientY,
      startW: widthRef.current,
      startH: currentH,
    };
    document.body.style.cursor = kind === "w" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, [onPointerMove, stopDrag]);

  const style: CSSProperties = {
    height: "fit-content",
    alignSelf: "flex-start",
    ...(hydrated && maxHeight != null ? { maxHeight: `${maxHeight}px` } : {}),
    ...(hydrated
      ? { ["--preview-w" as string]: `${width}px` }
      : { ["--preview-w" as string]: `${DEFAULT_W}px` }),
  };

  return (
    <div
      ref={shellRef}
      data-preview-shell={storageKeyPrefix}
      className={cn(
        "relative flex w-full min-w-0 flex-col overflow-visible lg:w-[var(--preview-w)] lg:max-w-full lg:shrink-0",
        className,
      )}
      style={style}
    >
      <button
        type="button"
        aria-label="Изменить ширину предпросмотра"
        className="absolute -left-1 top-0 z-raised hidden h-full w-2 cursor-col-resize items-center justify-center opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 lg:flex"
        onPointerDown={(e) => startDrag("w", e)}
      >
        <span
          className="h-10 w-0.5 rounded-full bg-[#2fc6f6]/80"
          aria-hidden
        />
      </button>

      <div className="flex h-auto flex-col overflow-visible">
        {children}
      </div>

      <button
        type="button"
        aria-label="Изменить высоту предпросмотра"
        className="absolute bottom-0 left-0 z-raised flex h-2 w-full cursor-row-resize items-end justify-center opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
        onPointerDown={(e) => startDrag("h", e)}
      >
        <span
          className="mb-0.5 h-0.5 w-10 rounded-full bg-[#2fc6f6]/80"
          aria-hidden
        />
      </button>
    </div>
  );
}
