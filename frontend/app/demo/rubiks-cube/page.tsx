import type { Metadata } from "next";
import Link from "next/link";
import { RubiksCubeHero } from "@/components/webgl/RubiksCubeHero";

export const metadata: Metadata = {
  title: "Rubik's Cube Hero — DocSaaS demo",
  description: "Demo 3D Rubik cube: face turns and reverse solve.",
};

/**
 * Demo Hero: headline + CTA beside RubiksCubeHero (white/green + face turns).
 */
export default function RubiksCubeDemoPage() {
  return (
    <main className="min-h-dvh bg-landing-grey text-landing-ink">
      <section
        className="relative w-full overflow-hidden"
        aria-labelledby="rubiks-demo-title"
        data-demo="rubiks-hero"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-landing-grey"
          aria-hidden
        />

        <div className="relative mx-auto grid w-full max-w-[92rem] gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:min-h-dvh lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-10 lg:px-10 lg:py-16">
          <div className="relative z-10 flex flex-col justify-center lg:pr-4">
            <p className="mb-3 text-sm font-semibold tracking-[0.18em] text-brand uppercase">
              DocSaaS · WebGL demo
            </p>
            <h1
              id="rubiks-demo-title"
              className="font-hero text-[clamp(2.2rem,6vw,4.75rem)] font-bold leading-[1.05] tracking-[-0.035em] text-landing-ink"
            >
              Собираем хаос
              <span className="block text-landing-ink/70">в идеальный порядок.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-landing-ink/65 sm:text-lg">
              Старт — зелёная грань сверху. Десять случайных поворотов слоёв
              перемешивают кубик, затем те же ходы назад снова собирают все
              зелёные наклейки наверх. Цвет каждой наклейки не меняется — крутятся
              только грани.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                Начать
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-landing-ink/15 bg-white px-6 py-3 text-sm font-semibold text-landing-ink transition hover:bg-white/90"
              >
                На лендинг
              </Link>
            </div>
          </div>

          <div className="relative z-0 h-[min(58vh,420px)] w-full sm:h-[min(62vh,520px)] lg:h-[min(78vh,640px)]">
            <RubiksCubeHero className="h-full w-full overflow-hidden rounded-3xl" />
          </div>
        </div>
      </section>
    </main>
  );
}
