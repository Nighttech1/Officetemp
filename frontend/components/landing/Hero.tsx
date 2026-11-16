import { HeroAtmosphere } from "./HeroAtmosphere";
import { LandingShimmerLink } from "./LandingShimmerLink";
import { RubiksCubeHero } from "@/components/webgl/RubiksCubeHero";

const HEADLINE = ["Документы", "из шаблона.", "Без срыва", "вёрстки."] as const;

/** C-203: RubiksCube без подписи и без рамки — фон = хедер */
export function Hero() {
  return (
    <section
      className="landing-hero relative overflow-x-clip bg-landing-grey text-landing-ink"
      aria-labelledby="landing-hero-title"
      data-landing-theme="grey"
    >
      <HeroAtmosphere />

      <div className="relative z-10 mx-auto grid w-full max-w-[92rem] gap-4 px-4 pb-6 pt-6 sm:gap-6 sm:px-6 sm:pb-10 sm:pt-8 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-6 lg:px-10 lg:pb-16 lg:pt-12">
        <div className="relative z-10 flex flex-col justify-center lg:pr-4">
          <p className="landing-reveal mb-2 font-hero text-[clamp(1.25rem,2.4vw,2rem)] font-bold tracking-[-0.04em] text-landing-ink sm:mb-4">
            DocSaaS
          </p>

          <h1
            id="landing-hero-title"
            className="landing-reveal font-hero text-[clamp(2.15rem,7.6vw,6.1rem)] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[clamp(2.6rem,7.6vw,6.1rem)]"
          >
            {HEADLINE.map((line) => (
              <span
                key={line}
                className="landing-hero-line block overflow-hidden pb-[0.12em]"
              >
                <span className="landing-hero-line-inner inline-block pb-[0.06em]">
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <p className="landing-reveal mt-4 max-w-lg text-[0.95rem] leading-relaxed text-landing-ink/80 sm:mt-6 sm:text-lg">
            Генерация DOCX и PDF из Word-шаблонов и таблиц Excel, Google и
            Яндекс. Очередь Celery, ZIP-архив, контур под 152‑ФЗ.
          </p>

          <div className="landing-reveal mt-5 flex flex-wrap gap-3 sm:mt-8">
            <LandingShimmerLink href="/register" variant="brand">
              Начать
            </LandingShimmerLink>
          </div>
        </div>

        <div className="landing-reveal relative z-0 -mx-2 mt-1 flex items-center justify-center sm:-mx-1 sm:mt-2 lg:mx-0 lg:mt-0 lg:min-h-0 lg:justify-end lg:pl-2">
          <div className="aspect-square w-[min(100%,340px)] bg-transparent sm:w-[min(100%,520px)] lg:w-full lg:max-w-[min(100%,48vw)]">
            <RubiksCubeHero className="h-full min-h-0 w-full bg-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
