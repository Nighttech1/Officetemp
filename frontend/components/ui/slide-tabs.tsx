"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type SlideTabItem = {
  id: string;
  label: string;
  /** Серый заголовок, пока предыдущие шаги не заполнены (C-217). */
  subdued?: boolean;
};

type Props = {
  tabs: SlideTabItem[];
  selected: number;
  onSelect: (index: number) => void;
  className?: string;
  "aria-label"?: string;
  /**
   * auto — горизонтально, если влезает; иначе вертикальный список слева.
   * C-205: без cheap overflow-x scrollbar.
   */
  layout?: "auto" | "horizontal" | "vertical";
  /** Сообщить родителю, что шаги перешли в вертикальный режим. */
  onOrientationChange?: (vertical: boolean) => void;
};

type CursorPos = {
  left: number;
  top: number;
  width: number;
  height: number;
  opacity: number;
};

/**
 * Индикатор обводкой. Без overflow-x-auto.
 * C-131 hover-scrub; C-205 auto → vertical when narrow.
 */
export function SlideTabs({
  tabs,
  selected,
  onSelect,
  className,
  "aria-label": ariaLabel = "Шаги",
  layout = "auto",
  onOrientationChange,
}: Props) {
  const [vertical, setVertical] = useState(layout === "vertical");
  const [position, setPosition] = useState<CursorPos>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });
  const shellRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const measureRowRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const lastHoverIdx = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const onOrientRef = useRef(onOrientationChange);
  onOrientRef.current = onOrientationChange;

  const measureCursor = () => {
    const el = tabsRef.current[selected];
    const list = listRef.current;
    if (!el || !list) return;
    if (vertical) {
      const top = el.offsetTop;
      const height = el.offsetHeight;
      setPosition((prev) => {
        if (
          prev.top === top &&
          prev.height === height &&
          prev.width === el.offsetWidth &&
          prev.opacity === 1 &&
          prev.left === el.offsetLeft
        ) {
          return prev;
        }
        return {
          left: el.offsetLeft,
          top,
          width: el.offsetWidth,
          height,
          opacity: 1,
        };
      });
      return;
    }
    const left = el.offsetLeft;
    const width = el.offsetWidth;
    setPosition((prev) => {
      if (
        prev.left === left &&
        prev.width === width &&
        prev.height === el.offsetHeight &&
        prev.opacity === 1 &&
        prev.top === el.offsetTop
      ) {
        return prev;
      }
      return {
        left,
        top: el.offsetTop,
        width,
        height: el.offsetHeight,
        opacity: 1,
      };
    });
  };

  // Fit check for auto layout
  useLayoutEffect(() => {
    if (layout === "horizontal") {
      setVertical(false);
      return;
    }
    if (layout === "vertical") {
      setVertical(true);
      return;
    }
    const shell = shellRef.current;
    const row = measureRowRef.current;
    if (!shell || !row) return;

    const check = () => {
      const need = row.scrollWidth;
      // C-204: не мерять по узкой vertical-колонке родителя — иначе
      // после сужения окна переключатель «залипает» в vertical навсегда.
      const fitHost = shell.closest(
        "[data-slide-tabs-fit]",
      ) as HTMLElement | null;
      const have = fitHost?.clientWidth ?? shell.clientWidth;
      // небольшой запас под padding родителя
      const next = need > have - 4;
      setVertical((prev) => {
        if (prev === next) return prev;
        // Не вызывать setState родителя внутри updater — React считает это
        // «update while rendering» (ломает WaybillWizard / InfoSheetWizard).
        queueMicrotask(() => onOrientRef.current?.(next));
        return next;
      });
    };

    check();
    const ro = new ResizeObserver(check);
    ro.observe(shell);
    const fitHost = shell.closest(
      "[data-slide-tabs-fit]",
    ) as HTMLElement | null;
    if (fitHost) ro.observe(fitHost);
    window.addEventListener("resize", check);
    void document.fonts?.ready.then(check);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [layout, tabs]);

  useLayoutEffect(() => {
    measureCursor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, tabs, vertical]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(() => measureCursor());
    ro.observe(list);
    window.addEventListener("resize", measureCursor);
    const t = window.setTimeout(measureCursor, 50);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureCursor);
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, tabs, vertical]);

  function indexFromClient(clientX: number, clientY: number): number | null {
    const buttons = tabsRef.current;
    for (let i = 0; i < buttons.length; i++) {
      const el = buttons[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (
        clientX >= r.left &&
        clientX < r.right &&
        clientY >= r.top &&
        clientY < r.bottom
      ) {
        return i;
      }
    }
    return null;
  }

  function onBarPointerMove(clientX: number, clientY: number) {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const idx = indexFromClient(clientX, clientY);
      if (idx == null) return;
      if (lastHoverIdx.current === idx) return;
      lastHoverIdx.current = idx;
      if (idx !== selectedRef.current) {
        // C-224: переключаем шаг при наведении.
        // Лаг дерева снят: persist(step) не бампит refreshKey.
        onSelectRef.current(idx);
      }
    });
  }

  const tabButtons = (forMeasure: boolean) =>
    tabs.map((tab, i) => {
      const active = selected === i;
      return (
        <button
          key={forMeasure ? `m-${tab.id}` : tab.id}
          ref={
            forMeasure
              ? undefined
              : (el) => {
                  tabsRef.current[i] = el;
                }
          }
          type="button"
          role={forMeasure ? undefined : "tab"}
          aria-selected={forMeasure ? undefined : active}
          tabIndex={forMeasure ? -1 : active ? 0 : -1}
          aria-hidden={forMeasure ? true : undefined}
          disabled={forMeasure}
          onClick={
            forMeasure
              ? undefined
              : (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(i);
                }
          }
          onKeyDown={
            forMeasure
              ? undefined
              : (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(i);
                  }
                  const vertKeys =
                    e.key === "ArrowDown" || e.key === "ArrowUp";
                  const horizKeys =
                    e.key === "ArrowRight" || e.key === "ArrowLeft";
                  if ((vertical && vertKeys) || (!vertical && horizKeys)) {
                    e.preventDefault();
                    const dir =
                      e.key === "ArrowRight" || e.key === "ArrowDown"
                        ? 1
                        : -1;
                    const next = (i + dir + tabs.length) % tabs.length;
                    onSelect(next);
                    tabsRef.current[next]?.focus();
                  }
                }
          }
          className={cn(
            "relative z-10 block cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold uppercase tracking-wide transition-colors md:px-4 md:py-2",
            vertical && "w-full text-left",
            tab.subdued
              ? "text-ink-muted/70 hover:text-ink-muted"
              : active
                ? "text-ink"
                : "text-ink-muted hover:text-ink",
            forMeasure && "pointer-events-none",
          )}
        >
          {tab.label}
        </button>
      );
    });

  return (
    <div
      ref={shellRef}
      className={cn("relative w-full min-w-0", className)}
      data-steps-orientation={vertical ? "vertical" : "horizontal"}
    >
      {/* Invisible horizontal measure row for auto fit */}
      {layout === "auto" ? (
        <div
          ref={measureRowRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 -z-10 flex w-max flex-nowrap opacity-0"
        >
          <div className="flex flex-nowrap rounded-full border border-transparent p-1">
            {tabButtons(true)}
          </div>
        </div>
      ) : null}

      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation={vertical ? "vertical" : "horizontal"}
        className={cn(
          "relative border border-white/40 bg-transparent p-1",
          vertical
            ? "flex w-full flex-col items-stretch gap-0.5 rounded-2xl"
            : "mx-0 inline-flex w-max max-w-full flex-nowrap justify-start overflow-hidden rounded-full",
        )}
        onMouseMove={(e) => {
          onBarPointerMove(e.clientX, e.clientY);
        }}
        onMouseLeave={() => {
          lastHoverIdx.current = null;
          if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
          // Вернуть индикатор на выбранный шаг
          const el = tabsRef.current[selectedRef.current];
          if (el) {
            setPosition({
              left: el.offsetLeft,
              top: el.offsetTop,
              width: el.offsetWidth,
              height: el.offsetHeight,
              opacity: 1,
            });
          }
        }}
      >
        {tabButtons(false)}
        <motion.span
          aria-hidden
          initial={false}
          animate={{
            left: position.left,
            top: position.top,
            width: position.width,
            height: position.height,
            opacity: position.opacity,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 34 }}
          className="pointer-events-none absolute z-0 box-border rounded-full border-2 border-brand bg-brand/10 shadow-[0_0_20px_-6px_rgba(34,197,94,0.45)]"
        />
      </div>
    </div>
  );
}
