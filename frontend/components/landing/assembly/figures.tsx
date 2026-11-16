import type { AssemblyConfig, AssemblyFigure } from "./types";

export type { AssemblyConfig, AssemblyFigure };

export function FigureShape({ figure }: { figure: AssemblyFigure }) {
  const w = figure.w ?? 120;
  const h = figure.h ?? 120;
  const fill = figure.color;

  switch (figure.type) {
    case "disc":
      return (
        <ellipse
          cx={0}
          cy={0}
          rx={w / 2}
          ry={h / 2}
          fill={fill}
          opacity={0.92}
        />
      );
    case "ring":
      return (
        <g>
          <ellipse
            cx={0}
            cy={0}
            rx={w / 2}
            ry={h / 2}
            fill="none"
            stroke={fill}
            strokeWidth={Math.max(14, w * 0.12)}
            opacity={0.9}
          />
        </g>
      );
    case "cylinder":
      return (
        <g>
          <rect
            x={-w / 2}
            y={-h / 2 + w * 0.18}
            width={w}
            height={h - w * 0.36}
            rx={w * 0.08}
            fill={fill}
            opacity={0.88}
          />
          <ellipse
            cx={0}
            cy={-h / 2 + w * 0.18}
            rx={w / 2}
            ry={w * 0.18}
            fill={fill}
            opacity={1}
          />
          <ellipse
            cx={0}
            cy={h / 2 - w * 0.18}
            rx={w / 2}
            ry={w * 0.18}
            fill={fill}
            opacity={0.75}
          />
        </g>
      );
    case "cone":
      return (
        <polygon
          points={`0,${-h / 2} ${w / 2},${h / 2} ${-w / 2},${h / 2}`}
          fill={fill}
          opacity={0.9}
        />
      );
    case "bar":
      return (
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={h / 2}
          fill={fill}
          opacity={0.92}
        />
      );
    case "capsule":
      return (
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={w / 2}
          fill={fill}
          opacity={0.95}
        />
      );
    default:
      return (
        <circle cx={0} cy={0} r={40} fill={fill} opacity={0.9} />
      );
  }
}

export function resolveFigures(
  config: AssemblyConfig,
  lite: boolean,
): AssemblyFigure[] {
  if (!lite) return config.figures;
  return config.figures.slice(0, Math.min(5, config.figures.length));
}
