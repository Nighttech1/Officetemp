"use client";

import { Float, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

type FaceKey = "right" | "left" | "top" | "bottom" | "front" | "back";
type MoveFace = "R" | "L" | "U" | "D" | "F" | "B";
type Move = { face: MoveFace; dir: 1 | -1 };

/** Immutable sticker paint — color never remapped during animation. */
type StickerDef = {
  face: FaceKey;
  /** Hex baked once at cubie birth. */
  color: string;
};

type CubieDef = {
  id: string;
  home: THREE.Vector3Tuple;
  stickers: StickerDef[];
};

/** Natural Rubik look: dark plastic seams + lit white/green stickers. */
export const DEFAULT_RUBIKS_COLORS = {
  /** Dark core between cubies / around stickers (classic Rubik frame). */
  plastic: "#2A2A2A",
  /** Natural white stickers (StandardMaterial + studio lights). */
  white: "#FFFFFF",
  green: "#22C55E",
  greenFace: "top" as FaceKey,
  accent: "#22C55E",
  /** Transparent host — blends with landing header/hero. */
  host: "transparent",
} as const;

export type RubiksColors = {
  plastic?: string;
  white?: string;
  green?: string;
  greenFace?: FaceKey;
  accent?: string;
  host?: string;
};

export type RubiksCubeHeroProps = {
  className?: string;
  colors?: RubiksColors;
  parallaxStrength?: number;
  turnSeconds?: number;
};

/** Gaps between cubies reveal dark plastic edges (seams). */
const CUBIE_SIZE = 0.88;
const CUBIE_RADIUS = 0.08;
const STICKER = 0.7;
const GRID = [-1, 0, 1] as const;
const EPS = 0.35;
const MOVE_FACES: MoveFace[] = ["R", "L", "U", "D", "F", "B"];

const FACE_AXIS: Record<MoveFace, THREE.Vector3> = {
  R: new THREE.Vector3(1, 0, 0),
  L: new THREE.Vector3(-1, 0, 0),
  U: new THREE.Vector3(0, 1, 0),
  D: new THREE.Vector3(0, -1, 0),
  F: new THREE.Vector3(0, 0, 1),
  B: new THREE.Vector3(0, 0, -1),
};

const STICKER_POSE: Record<
  FaceKey,
  { position: THREE.Vector3Tuple; rotation: THREE.EulerTuple }
> = {
  right: { position: [CUBIE_SIZE / 2 + 0.014, 0, 0], rotation: [0, Math.PI / 2, 0] },
  left: { position: [-CUBIE_SIZE / 2 - 0.014, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  top: { position: [0, CUBIE_SIZE / 2 + 0.014, 0], rotation: [-Math.PI / 2, 0, 0] },
  bottom: { position: [0, -CUBIE_SIZE / 2 - 0.014, 0], rotation: [Math.PI / 2, 0, 0] },
  front: { position: [0, 0, CUBIE_SIZE / 2 + 0.014], rotation: [0, 0, 0] },
  back: { position: [0, 0, -CUBIE_SIZE / 2 - 0.014], rotation: [0, Math.PI, 0] },
};

const IDLE_ASSEMBLED = 2.6;
const HANG_SCRAMBLED = 1.5;
const SETTLE = 1.3;
const SCRAMBLE_LEN = 10;
/** После возврата на лендинг — только плавный idle, без серии поворотов. */
const RESUME_GRACE_MS = 1400;

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function snapCoord(n: number) {
  return Math.max(-1, Math.min(1, Math.round(n))) as -1 | 0 | 1;
}

function onLayer(pos: THREE.Vector3, face: MoveFace) {
  switch (face) {
    case "R":
      return pos.x > 1 - EPS;
    case "L":
      return pos.x < -1 + EPS;
    case "U":
      return pos.y > 1 - EPS;
    case "D":
      return pos.y < -1 + EPS;
    case "F":
      return pos.z > 1 - EPS;
    case "B":
      return pos.z < -1 + EPS;
  }
}

/** Bake stickers once: only greenFace gets green; all other exposed faces white. */
function bakeStickers(
  home: THREE.Vector3Tuple,
  greenFace: FaceKey,
  white: string,
  green: string,
): StickerDef[] {
  const [x, y, z] = home;
  const faces: FaceKey[] = [];
  if (x === 1) faces.push("right");
  if (x === -1) faces.push("left");
  if (y === 1) faces.push("top");
  if (y === -1) faces.push("bottom");
  if (z === 1) faces.push("front");
  if (z === -1) faces.push("back");
  return faces.map((face) => ({
    face,
    color: face === greenFace ? green : white,
  }));
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 10 random quarter-turns; avoid same face twice in a row. */
function randomScramble(seed: number, length = SCRAMBLE_LEN): Move[] {
  const rnd = mulberry32(seed);
  const moves: Move[] = [];
  let prev: MoveFace | null = null;
  for (let i = 0; i < length; i++) {
    let face = MOVE_FACES[Math.floor(rnd() * MOVE_FACES.length)];
    while (face === prev) {
      face = MOVE_FACES[Math.floor(rnd() * MOVE_FACES.length)];
    }
    prev = face;
    const dir = (rnd() < 0.5 ? 1 : -1) as 1 | -1;
    moves.push({ face, dir });
  }
  return moves;
}

function invertSequence(moves: Move[]): Move[] {
  return [...moves].reverse().map((m) => ({
    face: m.face,
    dir: (m.dir === 1 ? -1 : 1) as 1 | -1,
  }));
}

function commitMove(
  positions: THREE.Vector3[],
  orients: THREE.Quaternion[],
  move: Move,
) {
  const axis = FACE_AXIS[move.face];
  const q = new THREE.Quaternion().setFromAxisAngle(axis, move.dir * (Math.PI / 2));
  for (let i = 0; i < positions.length; i++) {
    if (!onLayer(positions[i], move.face)) continue;
    positions[i].applyQuaternion(q);
    positions[i].set(
      snapCoord(positions[i].x),
      snapCoord(positions[i].y),
      snapCoord(positions[i].z),
    );
    orients[i].premultiply(q);
  }
}

function resetSolved(
  cubies: CubieDef[],
  positions: THREE.Vector3[],
  orients: THREE.Quaternion[],
) {
  for (let i = 0; i < cubies.length; i++) {
    positions[i].set(...cubies[i].home);
    orients[i].identity();
  }
}

type Mode = "idle" | "scramble" | "hang" | "solve" | "settle";

type Engine = {
  positions: THREE.Vector3[];
  orients: THREE.Quaternion[];
  scramble: Move[];
  solve: Move[];
  mode: Mode;
  moveIndex: number;
  /** 0..1 within current quarter-turn */
  progress: number;
  /** seconds spent in current mode */
  modeTime: number;
  cycle: number;
};

function CubieMesh({
  def,
  plasticMat,
  matByColor,
}: {
  def: CubieDef;
  plasticMat: THREE.MeshStandardMaterial;
  matByColor: Map<string, THREE.MeshStandardMaterial>;
}) {
  return (
    <>
      <RoundedBox
        args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]}
        radius={CUBIE_RADIUS}
        smoothness={4}
        material={plasticMat}
      />
      {def.stickers.map((sticker) => {
        const pose = STICKER_POSE[sticker.face];
        const mat = matByColor.get(sticker.color)!;
        return (
          <mesh
            key={`${def.id}-${sticker.face}`}
            position={pose.position}
            rotation={pose.rotation}
            material={mat}
          >
            <planeGeometry args={[STICKER, STICKER]} />
          </mesh>
        );
      })}
    </>
  );
}

function RubiksAssembly({
  colors,
  parallaxStrength,
  turnSeconds,
  reducedMotion,
  active,
}: {
  colors: Required<Omit<RubiksColors, "greenFace">> & { greenFace: FaceKey };
  parallaxStrength: number;
  turnSeconds: number;
  reducedMotion: boolean;
  active: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const cubieRefs = useRef<(THREE.Group | null)[]>([]);
  const pointer = useRef({ x: 0, y: 0 });
  const animQ = useMemo(() => new THREE.Quaternion(), []);
  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);

  const cubies = useMemo(() => {
    const list: CubieDef[] = [];
    for (const x of GRID) {
      for (const y of GRID) {
        for (const z of GRID) {
          if (x === 0 && y === 0 && z === 0) continue;
          const home: THREE.Vector3Tuple = [x, y, z];
          list.push({
            id: `${x}:${y}:${z}`,
            home,
            stickers: bakeStickers(home, colors.greenFace, colors.white, colors.green),
          });
        }
      }
    }
    return list;
  }, [colors.greenFace, colors.white, colors.green]);

  const { plasticMat, matByColor } = useMemo(() => {
    // Dark plastic = visible seams between cubies and around stickers.
    const plasticMat = new THREE.MeshStandardMaterial({
      color: colors.plastic,
      roughness: 0.72,
      metalness: 0.05,
    });
    // Natural white / green stickers with soft studio response.
    const whiteMat = new THREE.MeshStandardMaterial({
      color: colors.white,
      roughness: 0.32,
      metalness: 0.02,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.14,
      side: THREE.DoubleSide,
    });
    const greenMat = new THREE.MeshStandardMaterial({
      color: colors.green,
      roughness: 0.34,
      metalness: 0.04,
      emissive: new THREE.Color(colors.green),
      emissiveIntensity: 0.06,
      side: THREE.DoubleSide,
    });
    const matByColor = new Map<string, THREE.MeshStandardMaterial>();
    matByColor.set(colors.white, whiteMat);
    matByColor.set(colors.green, greenMat);
    return { plasticMat, matByColor };
  }, [colors.plastic, colors.white, colors.green]);

  useEffect(() => {
    return () => {
      plasticMat.dispose();
      matByColor.forEach((m) => m.dispose());
    };
  }, [plasticMat, matByColor]);

  const engine = useRef<Engine | null>(null);
  const wasActive = useRef(false);
  const resumeGraceUntil = useRef(0);
  const idleSpin = useRef(0);
  if (!engine.current) {
    const positions = cubies.map((c) => new THREE.Vector3(...c.home));
    const orients = cubies.map(() => new THREE.Quaternion());
    const scramble = randomScramble(1);
    engine.current = {
      positions,
      orients,
      scramble,
      solve: invertSequence(scramble),
      mode: "idle",
      moveIndex: 0,
      progress: 0,
      modeTime: 0,
      cycle: 0,
    };
  }

  // If cubie count changes (hot reload / color bake), resize engine buffers.
  useEffect(() => {
    const e = engine.current!;
    if (e.positions.length !== cubies.length) {
      e.positions = cubies.map((c) => new THREE.Vector3(...c.home));
      e.orients = cubies.map(() => new THREE.Quaternion());
      resetSolved(cubies, e.positions, e.orients);
      e.mode = "idle";
      e.moveIndex = 0;
      e.progress = 0;
      e.modeTime = 0;
    }
  }, [cubies]);

  useEffect(() => {
    const onMove = (ev: PointerEvent) => {
      pointer.current.x = (ev.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (ev.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // C-211: уход с вкладки = пауза; по возврату — обычный старт, без догона
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) wasActive.current = false;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useFrame((_, delta) => {
    const g = root.current;
    const e = engine.current;
    if (!g || !e) return;

    // C-211: вкладка/страница снова видима — не догонять пропущенное время
    if (!active) {
      wasActive.current = false;
      return;
    }
    const resumed = !wasActive.current;
    wasActive.current = true;
    if (resumed) {
      resetSolved(cubies, e.positions, e.orients);
      e.mode = "idle";
      e.moveIndex = 0;
      e.progress = 0;
      e.modeTime = 0;
      resumeGraceUntil.current = performance.now() + RESUME_GRACE_MS;
    }

    // Жёсткий потолок кадра — иначе после фона delta=секунды → «бешеные» повороты
    const dt = Math.min(Math.max(delta, 0), 1 / 30);

    idleSpin.current += dt * (reducedMotion ? 0.1 : 0.22);
    const baseY = idleSpin.current;
    const targetX = -pointer.current.y * parallaxStrength - 0.35;
    const targetY = pointer.current.x * parallaxStrength * 1.15 + baseY;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetX, 1 - Math.exp(-5.5 * dt));
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetY, 1 - Math.exp(-4.8 * dt));

    let activeMove: Move | null = null;
    let progress = 0;

    const inGrace = performance.now() < resumeGraceUntil.current;

    if (!reducedMotion && !inGrace) {
      e.modeTime += dt;

      if (e.mode === "idle") {
        if (e.modeTime >= IDLE_ASSEMBLED) {
          e.cycle += 1;
          e.scramble = randomScramble(1000 + e.cycle * 9973);
          e.solve = invertSequence(e.scramble);
          resetSolved(cubies, e.positions, e.orients);
          e.mode = "scramble";
          e.moveIndex = 0;
          e.progress = 0;
          e.modeTime = 0;
        }
      } else if (e.mode === "scramble" || e.mode === "solve") {
        const seq = e.mode === "scramble" ? e.scramble : e.solve;
        e.progress += dt / turnSeconds;
        if (e.progress >= 1) {
          // Commit full quarter-turn — stickers keep baked colors.
          commitMove(e.positions, e.orients, seq[e.moveIndex]);
          e.moveIndex += 1;
          e.progress = 0;
          if (e.moveIndex >= seq.length) {
            e.mode = e.mode === "scramble" ? "hang" : "settle";
            e.moveIndex = 0;
            e.modeTime = 0;
          }
        }
        if (e.mode === "scramble" || e.mode === "solve") {
          activeMove = (e.mode === "scramble" ? e.scramble : e.solve)[e.moveIndex];
          progress = easeInOutCubic(Math.min(1, e.progress));
        }
      } else if (e.mode === "hang") {
        if (e.modeTime >= HANG_SCRAMBLED) {
          e.mode = "solve";
          e.moveIndex = 0;
          e.progress = 0;
          e.modeTime = 0;
        }
      } else if (e.mode === "settle") {
        if (e.modeTime >= SETTLE) {
          resetSolved(cubies, e.positions, e.orients);
          e.mode = "idle";
          e.modeTime = 0;
          e.moveIndex = 0;
          e.progress = 0;
        }
      }
    } else {
      resetSolved(cubies, e.positions, e.orients);
    }

    for (let i = 0; i < cubies.length; i++) {
      const node = cubieRefs.current[i];
      if (!node) continue;

      if (activeMove && onLayer(e.positions[i], activeMove.face)) {
        const axis = FACE_AXIS[activeMove.face];
        animQ.setFromAxisAngle(axis, activeMove.dir * (Math.PI / 2) * progress);
        tmpPos.copy(e.positions[i]).applyQuaternion(animQ);
        tmpQ.copy(animQ).multiply(e.orients[i]);
        node.position.copy(tmpPos);
        node.quaternion.copy(tmpQ);
      } else {
        node.position.copy(e.positions[i]);
        node.quaternion.copy(e.orients[i]);
      }
    }
  });

  const content = (
    <group ref={root} rotation={[-0.35, 0.55, 0]}>
      {cubies.map((def, i) => (
        <group
          key={def.id}
          ref={(el) => {
            cubieRefs.current[i] = el;
          }}
          position={def.home}
        >
          <CubieMesh def={def} plasticMat={plasticMat} matByColor={matByColor} />
        </group>
      ))}
    </group>
  );

  if (reducedMotion) return content;

  return (
    <Float speed={0.85} rotationIntensity={0.12} floatIntensity={0.32} floatingRange={[-0.06, 0.08]}>
      {content}
    </Float>
  );
}

function SceneLights({ accent }: { accent: string }) {
  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[4, 7.5, 3.5]} intensity={1.35} />
      <directionalLight position={[-3.5, 2.5, -2.5]} intensity={0.42} />
      <pointLight position={[0, 2.4, 3]} intensity={0.32} color={accent} distance={14} />
    </>
  );
}

/**
 * Rubik's cube: green TOP when solved; sticker colors immutable;
 * 10 random layer turns then exact reverse solve.
 */
export function RubiksCubeHero({
  className,
  colors,
  parallaxStrength = 0.62,
  turnSeconds = 0.5,
}: RubiksCubeHeroProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  const palette = useMemo(
    () => ({
      plastic: colors?.plastic ?? DEFAULT_RUBIKS_COLORS.plastic,
      white: colors?.white ?? DEFAULT_RUBIKS_COLORS.white,
      green: colors?.green ?? DEFAULT_RUBIKS_COLORS.green,
      greenFace: colors?.greenFace ?? DEFAULT_RUBIKS_COLORS.greenFace,
      accent: colors?.accent ?? DEFAULT_RUBIKS_COLORS.accent,
      host: colors?.host ?? DEFAULT_RUBIKS_COLORS.host,
    }),
    [colors],
  );

  useEffect(() => {
    setMounted(true);
    setReducedMotion(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio > 0.12),
      { threshold: [0, 0.12, 0.35] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const bgStyle: CSSProperties | undefined =
    palette.host === "transparent" ? undefined : { background: palette.host };

  return (
    <div
      ref={hostRef}
      className={cn("relative h-full w-full min-h-[280px] bg-transparent", className)}
      style={bgStyle}
      data-rubiks-hero
      data-green-face="top"
      aria-label="Кубик Рубика: зелёная верхняя грань, 10 поворотов и обратная сборка"
    >
      {mounted ? (
        <Canvas
          className="relative z-[1] !bg-transparent h-full w-full touch-none"
          style={{ background: "transparent" }}
          dpr={[1, 2]}
          frameloop={inView ? "always" : "never"}
          gl={{ antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: "high-performance" }}
          camera={{ position: [4.6, 4.8, 5.4], fov: 36, near: 0.1, far: 40 }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            gl.domElement.style.background = "transparent";
          }}
        >
          <Suspense fallback={null}>
            <SceneLights accent={palette.accent} />
            <RubiksAssembly
              colors={palette}
              parallaxStrength={parallaxStrength}
              turnSeconds={turnSeconds}
              reducedMotion={reducedMotion}
              active={inView}
            />
          </Suspense>
        </Canvas>
      ) : (
        <div className="relative z-[1] flex h-full min-h-[280px] items-center justify-center">
          <div className="h-24 w-24 rounded-2xl bg-white/80 ring-1 ring-black/5" />
        </div>
      )}
    </div>
  );
}

export default RubiksCubeHero;
