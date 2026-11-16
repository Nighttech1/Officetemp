"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Maximize2, Move, ZoomIn, ZoomOut } from "lucide-react";
import {
  buildWizardContext,
  loadDocTemplate,
  resolveRowRange,
  type WaybillWizardState,
} from "@/lib/docs-store";
import { generateDocx } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  wizard: WaybillWizardState;
  docId: string;
  title?: string;
  className?: string;
};

type DocxPreviewApi = {
  renderAsync: (
    data: Blob | ArrayBuffer,
    bodyContainer: HTMLElement,
    styleContainer?: HTMLElement,
    options?: Record<string, unknown>,
  ) => Promise<unknown>;
};

declare global {
  interface Window {
    docx?: DocxPreviewApi;
  }
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;
const TOTAL_STEPS = 4;

async function loadScript(src: string, marker: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[${marker}]`,
  );
  if (existing) {
    if (
      (existing as HTMLScriptElement & { dataset: { loaded?: string } }).dataset
        .loaded === "1"
    ) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error(`Не загрузился ${src}`)),
      );
    });
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    const attr = marker.includes("=") ? marker.split("=")[0]! : marker;
    s.setAttribute(attr, "1");
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => reject(new Error(`Не загрузился ${src}`));
    document.head.appendChild(s);
  });
}

async function ensureDocxPreview(): Promise<DocxPreviewApi> {
  if (typeof window !== "undefined" && window.docx?.renderAsync) {
    return window.docx;
  }
  await loadScript(
    "https://unpkg.com/jszip@3.10.1/dist/jszip.min.js",
    "data-jszip",
  );
  await loadScript(
    "https://unpkg.com/docx-preview@0.4.1/dist/docx-preview.min.js",
    "data-docx-preview",
  );
  if (!window.docx?.renderAsync) {
    throw new Error("docx-preview не инициализировался");
  }
  return window.docx;
}

/** Расширяет section до реального правого края контента (текст+картинки). */
function expandSectionToContent(host: HTMLElement): number {
  const sections = Array.from(
    host.querySelectorAll("section.docx, section"),
  ) as HTMLElement[];
  const wrapper = host.querySelector(".docx-wrapper") as HTMLElement | null;
  const primary = sections[0] ?? wrapper ?? host;
  const prevTransform = primary.style.transform;
  primary.style.transform = "none";

  let natural = 320;
  for (const section of sections.length ? sections : [primary]) {
    const originLeft = section.getBoundingClientRect().left;
    let maxRight = section.getBoundingClientRect().width;
    section.querySelectorAll("*").forEach((node) => {
      const el = node as HTMLElement;
      if (!el.getBoundingClientRect) return;
      const r = el.getBoundingClientRect();
      if (r.width < 0.5 && r.height < 0.5) return;
      maxRight = Math.max(maxRight, r.right - originLeft);
    });
    const w = Math.max(320, Math.ceil(maxRight + 4));
    natural = Math.max(natural, w);
    section.style.width = `${w}px`;
    section.style.maxWidth = "none";
    section.style.overflow = "visible";
  }

  if (wrapper) {
    // Одна колонка страниц (не раздувать scrollWidth в 2× из-за max-content).
    wrapper.style.width = `${natural}px`;
    wrapper.style.maxWidth = `${natural}px`;
    wrapper.style.overflow = "visible";
  }
  host.style.width = `${natural}px`;
  host.style.maxWidth = `${natural}px`;
  host.style.overflow = "visible";

  primary.style.transform = prevTransform;
  return natural;
}

function measureNaturalWidth(host: HTMLElement): number {
  return expandSectionToContent(host);
}

function clampPan(
  x: number,
  y: number,
  scale: number,
  viewport: HTMLElement,
  host: HTMLElement,
): { x: number; y: number } {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const stage =
    host.parentElement instanceof HTMLElement ? host.parentElement : host;
  const docW =
    Math.max(stage.scrollWidth, stage.offsetWidth, host.scrollWidth) * scale;
  const docH =
    Math.max(stage.scrollHeight, stage.offsetHeight, host.scrollHeight) *
    scale;
  const minX = docW <= vw ? 0 : vw - docW;
  const maxX = 0;
  const minY = docH <= vh ? 0 : vh - docH;
  const maxY = 0;
  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y)),
  };
}

/**
 * Floating header (wp:anchor): docx-preview uses a 0×0 wrapper.
 * Keep ABSOLUTE; do NOT clamp to page width — expand page instead.
 */
function fixFloatingHeaderImages(host: HTMLElement): void {
  const imgs = Array.from(
    host.querySelectorAll(
      "header img, footer img, [class*='header'] img, [class*='footer'] img",
    ),
  ) as HTMLImageElement[];

  const applyOne = (img: HTMLImageElement) => {
    if (!img.naturalWidth || img.naturalWidth < 8) return;
    const wrap = img.parentElement;
    const displayW = img.naturalWidth;
    const displayH = Math.max(
      1,
      Math.round((img.naturalHeight * displayW) / img.naturalWidth),
    );
    if (wrap instanceof HTMLElement) {
      const top = wrap.style.top || "";
      const left = wrap.style.left || "";
      wrap.style.width = "0px";
      wrap.style.height = "0px";
      wrap.style.display = "inline-block";
      wrap.style.position = "relative";
      wrap.style.overflow = "visible";
      wrap.style.verticalAlign = "top";
      if (top) wrap.style.top = top;
      if (left) wrap.style.left = left;
    }
    img.style.position = "absolute";
    img.style.left = "0";
    img.style.top = "0";
    img.style.width = `${displayW}px`;
    img.style.height = `${displayH}px`;
    img.style.maxWidth = "none";
    img.style.margin = "0";
    img.style.display = "block";
    img.style.visibility = "visible";
    img.style.opacity = "1";
  };

  for (const img of imgs) {
    if (img.complete && img.naturalWidth > 0) applyOne(img);
    else img.addEventListener("load", () => applyOne(img), { once: true });
  }
}

function rowRangeReady(w: WaybillWizardState): boolean {
  return (
    Boolean(w.rowRangeConfirmed) &&
    w.rows.length > 0 &&
    typeof w.rowFrom === "number" &&
    typeof w.rowTo === "number" &&
    w.rowFrom >= 1 &&
    w.rowTo >= w.rowFrom
  );
}

/**
 * Живой предпросмотр: toolbar вне зоны pan, clamp краёв, колонтитулы+картинки.
 */
export function WaybillLivePreview({ wizard, docId, className }: Props) {
  const w = wizard;
  const hostRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle",
  );
  const [err, setErr] = useState<string | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const [panMode, setPanMode] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const lastTemplateRef = useRef<string>("");
  const renderGenRef = useRef(0);

  const scale = Math.min(
    ZOOM_MAX,
    Math.max(ZOOM_MIN, fitScale * userZoom),
  );

  const fillReady = rowRangeReady(w);
  const { selected } = resolveRowRange(w);

  const contextKey = useMemo(() => {
    try {
      return JSON.stringify({
        templateName: w.templateName,
        fillReady,
        confirmed: Boolean(w.rowRangeConfirmed),
        mapping: fillReady ? w.mapping : {},
        rowFrom: fillReady ? w.rowFrom : null,
        rowTo: fillReady ? w.rowTo : null,
        sample: fillReady ? selected.slice(0, 2) : [],
      });
    } catch {
      return String(w.templateName) + String(fillReady);
    }
  }, [
    w.templateName,
    w.mapping,
    w.rowFrom,
    w.rowTo,
    w.rowRangeConfirmed,
    fillReady,
    selected,
  ]);

  const userZoomRef = useRef(userZoom);
  userZoomRef.current = userZoom;

  const applyFit = useCallback((resetUser = false) => {
    const host = hostRef.current;
    const viewport = viewportRef.current;
    if (!host || !viewport) return 1;
    const natural = measureNaturalWidth(host);
    const avail = Math.max(120, viewport.clientWidth - 16);
    const next = Math.min(1, avail / natural);
    setFitScale(next);
    if (resetUser) {
      setUserZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setPan((p) =>
        clampPan(p.x, p.y, next * userZoomRef.current, viewport, host),
      );
    }
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
        hypothesisId: "H-clip",
        location: "WaybillLivePreview.tsx:applyFit",
        message: "fit metrics",
        data: {
          natural,
          avail,
          next,
          resetUser,
          hostScrollW: host.scrollWidth,
          vpClientW: viewport.clientWidth,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    if (!w.templateName) {
      host.innerHTML = "";
      setStatus("idle");
      setErr(null);
      return;
    }

    const gen = ++renderGenRef.current;
    const templateChanged = lastTemplateRef.current !== w.templateName;
    lastTemplateRef.current = w.templateName;

    const timer = window.setTimeout(() => {
      void (async () => {
        setStatus("loading");
        setErr(null);
        if (templateChanged) {
          setUserZoom(1);
          setPan({ x: 0, y: 0 });
        }
        try {
          const file = await loadDocTemplate(docId);
          if (!file) throw new Error("Файл шаблона не найден в браузере");
          let blob: Blob = file;
          // #region agent log
          fetch(
            "http://127.0.0.1:7681/ingest/5f74e7af-cc2f-4b5f-8ca1-8fa8f20ea9e6",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Debug-Session-Id": "6cfa5a",
              },
              body: JSON.stringify({
                sessionId: "6cfa5a",
                runId: "w87",
                hypothesisId: "H-fill",
                location: "WaybillLivePreview.tsx:run",
                message: fillReady
                  ? "WILL call generateDocx"
                  : "raw template only (no fill)",
                data: {
                  fillReady,
                  confirmed: Boolean(w.rowRangeConfirmed),
                  rowFrom: w.rowFrom ?? null,
                  rowTo: w.rowTo ?? null,
                  rowsLen: w.rows.length,
                  step: w.step,
                },
                timestamp: Date.now(),
              }),
            },
          ).catch(() => {});
          // #endregion
          if (fillReady) {
            try {
              const genBlob = await generateDocx(
                file,
                buildWizardContext(w),
              );
              blob = genBlob.blob;
            } catch {
              /* сырой шаблон */
            }
          }
          if (cancelled || gen !== renderGenRef.current || !hostRef.current)
            return;
          const api = await ensureDocxPreview();
          const staging = document.createElement("div");
          staging.className = "docx-waybill-preview";
          staging.style.position = "absolute";
          staging.style.left = "-99999px";
          staging.style.top = "0";
          staging.style.visibility = "hidden";
          document.body.appendChild(staging);
          try {
            await api.renderAsync(blob, staging, undefined, {
              className: "docx-preview-host",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: true,
              breakPages: true,
              ignoreLastRenderedPageBreak: false,
              useBase64URL: true,
              renderHeaders: true,
              renderFooters: true,
              renderFootnotes: true,
              renderEndnotes: true,
            });
            if (cancelled || gen !== renderGenRef.current || !hostRef.current)
              return;
            fixFloatingHeaderImages(staging);
            // Дождаться картинок колонтитулов — иначе ширина занижается и правый край режется.
            await new Promise<void>((resolve) => {
              const imgs = Array.from(staging.querySelectorAll("img"));
              let left = imgs.filter((img) => !img.complete).length;
              if (left === 0) {
                requestAnimationFrame(() => {
                  fixFloatingHeaderImages(staging);
                  resolve();
                });
                return;
              }
              const done = () => {
                left -= 1;
                if (left <= 0) {
                  fixFloatingHeaderImages(staging);
                  resolve();
                }
              };
              imgs.forEach((img) => {
                if (img.complete) return;
                img.addEventListener("load", done, { once: true });
                img.addEventListener("error", done, { once: true });
              });
              window.setTimeout(() => resolve(), 2500);
            });
            expandSectionToContent(staging);
            hostRef.current.innerHTML = "";
            while (staging.firstChild) {
              hostRef.current.appendChild(staging.firstChild);
            }
          } finally {
            staging.remove();
          }
          const fitted = applyFit(templateChanged || fillReady);
          // #region agent log
          {
            const h = hostRef.current;
            const section = h?.querySelector("section") as HTMLElement | null;
            fetch(
              "http://127.0.0.1:7681/ingest/5f74e7af-cc2f-4b5f-8ca1-8fa8f20ea9e6",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Debug-Session-Id": "6cfa5a",
                },
                body: JSON.stringify({
                  sessionId: "6cfa5a",
                  runId: "post-fix",
                  hypothesisId: "H-clip-fill",
                  location: "WaybillLivePreview.tsx:afterRender",
                  message: "preview rendered",
                  data: {
                    fitted,
                    fillReady,
                    templateChanged,
                    sectionW: section?.offsetWidth ?? null,
                    hostScrollW: h?.scrollWidth ?? null,
                    rowFrom: w.rowFrom ?? null,
                    rowTo: w.rowTo ?? null,
                    selectedLen: selected.length,
                  },
                  timestamp: Date.now(),
                }),
              },
            ).catch(() => {});
          }
          // #endregion
          if (!cancelled && gen === renderGenRef.current) setStatus("ok");
        } catch (e) {
          if (!cancelled && gen === renderGenRef.current) {
            setStatus("err");
            setErr(
              e instanceof Error ? e.message : "Не удалось показать Word",
            );
          }
        }
      })();
    }, fillReady ? 350 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- contextKey encodes wizard slice
  }, [docId, contextKey, w.templateName, fillReady, applyFit]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !w.templateName) return;
    const ro = new ResizeObserver(() => {
      applyFit(false);
    });
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [w.templateName, applyFit, status]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const host = hostRef.current;
    if (!viewport || !host || status !== "ok") return;
    setPan((p) => clampPan(p.x, p.y, scale, viewport, host));
  }, [scale, status]);

  function onZoomIn() {
    setUserZoom((z) => {
      const next = Math.min(ZOOM_MAX / Math.max(fitScale, 0.01), z + ZOOM_STEP);
      return +next.toFixed(2);
    });
  }
  function onZoomOut() {
    setUserZoom((z) => {
      const next = Math.max(ZOOM_MIN / Math.max(fitScale, 0.01), z - ZOOM_STEP);
      return +next.toFixed(2);
    });
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!panMode) return;
    if ((e.target as HTMLElement).closest(".docx-preview-toolbar")) return;
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d || !panMode) return;
    e.preventDefault();
    const viewport = viewportRef.current;
    const host = hostRef.current;
    const next = {
      x: d.panX + (e.clientX - d.x),
      y: d.panY + (e.clientY - d.y),
    };
    if (viewport && host) {
      setPan(clampPan(next.x, next.y, scale, viewport, host));
    } else {
      setPan(next);
    }
  }
  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function togglePan() {
    window.getSelection()?.removeAllRanges();
    setPanMode((v) => {
      if (v) {
        setPan({ x: 0, y: 0 });
      }
      return !v;
    });
  }

  const stepLabel = Math.min(TOTAL_STEPS, Math.max(1, w.step > 4 ? 4 : w.step));

  return (
    <aside
      className={cn(
        "flex h-auto flex-col gap-2 rounded-2xl border border-line bg-surface-card p-3 shadow-sm sm:p-4",
        className,
      )}
      aria-label="Предпросмотр накладной"
    >
      <div className="flex shrink-0 items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Предпросмотр
        </p>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-sm font-medium text-ink-muted">
          шаг {stepLabel}/{TOTAL_STEPS}
        </span>
      </div>
      {status === "loading" ? (
        <p className="shrink-0 text-xs text-ink-muted">Рендер Word…</p>
      ) : null}
      {err ? <p className="shrink-0 text-xs text-danger">{err}</p> : null}
      {!fillReady && w.templateName && w.rows.length > 0 ? (
        <p className="shrink-0 text-xs text-ink-muted">
          Показан шаблон. Данные подставятся после выбора строк на шаге
          «Стыковка».
        </p>
      ) : null}
      {!w.templateName ? (
        <div
          className="flex min-h-[12rem] rounded-xl bg-surface-muted/30"
          aria-hidden
        />
      ) : (
        <div className="relative min-h-[18rem] w-full">
          <div
            ref={viewportRef}
            className={cn(
              "docx-preview-viewport relative min-h-[18rem] w-full overflow-hidden rounded-xl bg-transparent",
              panMode && "docx-preview-viewport--pan",
              panMode ? "cursor-grab active:cursor-grabbing" : "cursor-default",
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div
              className="docx-preview-stage"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: "top left",
                width: "max-content",
              }}
            >
              <div ref={hostRef} className="docx-waybill-preview" />
            </div>
          </div>

          <div
            className="docx-preview-toolbar pointer-events-auto absolute right-3 top-3 z-30 flex flex-col items-center gap-1 rounded-md bg-white/95 p-1 shadow-lg ring-1 ring-black/15"
            role="toolbar"
            aria-label="Масштаб и перемещение предпросмотра"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerUp={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button
              type="button"
              className="docx-preview-tool-btn"
              title="Приблизить (макс. 150%)"
              aria-label="Приблизить"
              disabled={scale >= ZOOM_MAX - 0.001}
              onMouseDown={(e) => e.preventDefault()}
              onClick={onZoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="docx-preview-tool-btn"
              title="Отдалить (мин. 50%)"
              aria-label="Отдалить"
              disabled={scale <= ZOOM_MIN + 0.001}
              onMouseDown={(e) => e.preventDefault()}
              onClick={onZoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="docx-preview-tool-btn"
              title="Вписать в окно"
              aria-label="Вписать в окно"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyFit(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(
                "docx-preview-tool-btn",
                panMode && "docx-preview-tool-btn--active",
              )}
              title="Перемещение"
              aria-label="Режим перемещения"
              aria-pressed={panMode}
              onMouseDown={(e) => e.preventDefault()}
              onClick={togglePan}
            >
              <Move className="h-4 w-4" />
            </button>
            <span className="select-none px-0.5 pb-0.5 text-[10px] font-semibold tabular-nums text-zinc-600">
              {Math.round(scale * 100)}%
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
