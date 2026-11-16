"use client";

import Link from "next/link";
import {
  Slideshow,
  SlideshowImageContainer,
  SlideshowImageWrap,
  SlideshowIndicator,
} from "@/components/ui/slideshow";

const slides = [
  {
    title: "Накладные",
    href: "/app/documents/waybills",
    imageUrl:
      "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "ИУЛ и штампы",
    href: "/app/documents/info-sheet",
    imageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Договоры",
    href: "/register",
    imageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Пакетный ZIP",
    href: "/register",
    imageUrl:
      "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Таблицы данных",
    href: "/#method",
    imageUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
  },
] as const;

/**
 * C-188: как реф 21st — крупный список слева (~×3), большая картинка справа (~×2).
 * Тёмный фон как на демо-скрине.
 */
export function ServicesSlideshow() {
  return (
    <section
      id="services"
      className="landing-section scroll-mt-20 bg-landing-dark text-white"
      data-landing-theme="black"
      aria-labelledby="services-title"
    >
      <Slideshow className="mx-auto max-w-7xl place-content-center px-4 py-16 sm:px-6 sm:py-24 lg:px-10">
        <p className="landing-reveal mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand">
          / услуги
        </p>
        <h2
          id="services-title"
          className="landing-reveal mb-10 font-hero text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold tracking-tight text-white sm:mb-14"
        >
          Что делаем для вашей команды
        </h2>
        <div className="landing-reveal flex flex-col items-stretch gap-10 md:flex-row md:items-center md:justify-between md:gap-10 lg:gap-14">
          <div className="flex min-w-0 flex-[1.15] flex-col gap-3 sm:gap-4 md:gap-5">
            {slides.map((slide, index) => {
              const isAppDoc = slide.href.startsWith("/app/documents/");
              const className = "block w-fit max-w-full";
              const indicator = (
                <SlideshowIndicator
                  index={index}
                  className="cursor-pointer text-[clamp(2.4rem,5.8vw,4.75rem)] font-bold uppercase leading-[0.95] tracking-tighter text-white"
                >
                  {slide.title}
                </SlideshowIndicator>
              );
              return isAppDoc ? (
                <Link
                  key={slide.title}
                  href={slide.href}
                  prefetch={true}
                  className={className}
                >
                  {indicator}
                </Link>
              ) : (
                <a key={slide.title} href={slide.href} className={className}>
                  {indicator}
                </a>
              );
            })}
          </div>
          <SlideshowImageContainer className="relative mx-auto aspect-[9/14] h-[min(70vw,28rem)] w-full max-w-[min(100%,20rem)] shrink-0 overflow-hidden rounded-sm sm:h-[36rem] sm:max-w-[26rem] md:mx-0 md:h-[42rem] md:max-w-[28rem] lg:h-[48rem] lg:max-w-[32rem]">
            {slides.map((slide, index) => (
              <SlideshowImageWrap key={slide.title} index={index} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="size-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </SlideshowImageWrap>
            ))}
          </SlideshowImageContainer>
        </div>
      </Slideshow>
    </section>
  );
}
