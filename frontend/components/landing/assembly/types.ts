export type FigureType =
  | "disc"
  | "cylinder"
  | "cone"
  | "ring"
  | "bar"
  | "capsule";

export type AssemblyFigure = {
  id: string;
  type: FigureType;
  color: string;
  x: number;
  y: number;
  rot: number;
  scale: number;
  w?: number;
  h?: number;
  scatter: { x: number; y: number; rot: number };
  delay: number;
};

export type AssemblyConfig = {
  version: number;
  canvas: { width: number; height: number; bg: string };
  figures: AssemblyFigure[];
};
