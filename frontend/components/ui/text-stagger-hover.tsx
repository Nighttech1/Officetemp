"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  motion,
  type HTMLMotionProps,
  type Transition,
} from "motion/react";

export type StaggerDirection = "start" | "middle" | "end";

export interface StaggerOptions {
  direction?: StaggerDirection;
  staggerValue?: number;
  totalItems: number;
  index: number;
}

export function setStaggerDirection({
  direction = "start",
  staggerValue = 0.02,
  totalItems,
  index,
}: StaggerOptions): number {
  switch (direction) {
    case "start":
      return index * staggerValue;
    case "middle": {
      const middleIndex = Math.floor(totalItems / 2);
      return Math.abs(index - middleIndex) * staggerValue;
    }
    case "end":
      return (totalItems - 1 - index) * staggerValue;
    default:
      return 0;
  }
}

export type SplitTextResult = {
  words: string[];
  characters: string[];
  wordCount: number;
  characterCount: number;
};

export function splitText(text: string): SplitTextResult {
  if (!text?.trim()) {
    return { words: [], characters: [], wordCount: 0, characterCount: 0 };
  }
  const words = text.split(" ").map((word) => word.concat(" "));
  const characters = words.map((word) => word.split("")).flat(1);
  return {
    words,
    characters,
    wordCount: words.length,
    characterCount: characters.length,
  };
}

export type AnimationT =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "z"
  | "blur"
  | undefined;

export function useAnimationVariants(animation?: AnimationT) {
  return React.useMemo(
    () => ({
      hidden: {
        x: animation === "left" ? "-100%" : animation === "right" ? "100%" : 0,
        y: animation === "top" ? "-100%" : animation === "bottom" ? "100%" : 0,
        scale: animation === "z" ? 0 : 1,
        filter: animation === "blur" ? "blur(10px)" : "blur(0px)",
        opacity: 0,
      },
      visible: {
        x: 0,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        opacity: 1,
      },
    }),
    [animation],
  );
}

type TextStaggerHoverProps = {
  as?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLElement>, "children">;

interface TextStaggerHoverContextValue {
  isMouseIn: boolean;
}
const TextStaggerHoverContext = React.createContext<
  TextStaggerHoverContextValue | undefined
>(undefined);

function useTextStaggerHoverContext() {
  const context = React.useContext(TextStaggerHoverContext);
  if (!context) {
    throw new Error(
      "useTextStaggerHoverContext must be used within TextStaggerHover",
    );
  }
  return context;
}

export const TextStaggerHover = ({
  as: Component = "span",
  children,
  className,
  ...props
}: TextStaggerHoverProps) => {
  const [isMouseIn, setIsMouseIn] = React.useState(false);
  return (
    <TextStaggerHoverContext.Provider value={{ isMouseIn }}>
      {React.createElement(
        Component,
        {
          ...props,
          className: cn("relative inline-block overflow-hidden", className),
          onMouseEnter: () => setIsMouseIn(true),
          onMouseLeave: () => setIsMouseIn(false),
        },
        children,
      )}
    </TextStaggerHoverContext.Provider>
  );
};

interface TextStaggerHoverContentProps extends HTMLMotionProps<"span"> {
  animation?: AnimationT;
  staggerDirection?: StaggerDirection;
  forceActive?: boolean;
}

export const TextStaggerHoverActive = ({
  animation,
  staggerDirection = "start",
  children,
  className,
  transition,
  forceActive,
  ...props
}: TextStaggerHoverContentProps) => {
  const { characters, characterCount } = splitText(String(children));
  const animationVariants = useAnimationVariants(animation);
  const { isMouseIn } = useTextStaggerHoverContext();
  const active = forceActive ?? isMouseIn;
  return (
    <span className={cn("inline-block text-nowrap", className)}>
      {characters.map((char, index) => {
        const staggerDelay = setStaggerDirection({
          direction: staggerDirection,
          totalItems: characterCount,
          index,
        });
        return (
          <motion.span
            className="inline-block"
            key={`${char}-${index}`}
            variants={animationVariants}
            animate={active ? "hidden" : "visible"}
            transition={
              {
                delay: staggerDelay,
                ease: [0.25, 0.46, 0.45, 0.94],
                duration: 0.3,
                ...(transition as Transition | undefined),
              } as Transition
            }
            {...props}
          >
            {char}
            {char === " " && index < characters.length - 1 ? "\u00A0" : null}
          </motion.span>
        );
      })}
    </span>
  );
};

export const TextStaggerHoverHidden = ({
  animation,
  staggerDirection = "start",
  children,
  className,
  transition,
  forceActive,
  ...props
}: TextStaggerHoverContentProps) => {
  const { characters, characterCount } = splitText(String(children));
  const animationVariants = useAnimationVariants(animation);
  const { isMouseIn } = useTextStaggerHoverContext();
  const active = forceActive ?? isMouseIn;
  return (
    <span
      className={cn("absolute left-0 top-0 inline-block text-nowrap", className)}
    >
      {characters.map((char, index) => {
        const staggerDelay = setStaggerDirection({
          direction: staggerDirection,
          totalItems: characterCount,
          index,
        });
        return (
          <motion.span
            className="inline-block"
            key={`${char}-${index}`}
            variants={animationVariants}
            animate={active ? "visible" : "hidden"}
            transition={
              {
                delay: staggerDelay,
                ease: [0.25, 0.46, 0.45, 0.94],
                duration: 0.3,
                ...(transition as Transition | undefined),
              } as Transition
            }
            {...props}
          >
            {char}
            {char === " " && index < characters.length - 1 ? "\u00A0" : null}
          </motion.span>
        );
      })}
    </span>
  );
};
