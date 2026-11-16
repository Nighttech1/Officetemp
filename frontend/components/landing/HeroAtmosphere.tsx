"use client";

/**
 * Hero atmosphere — soft floating gradients + grain (inspired by 21st Floating Gradient id 19381).
 * Brand palette only: cream / grey / teal. No purple mesh slop.
 */
export function HeroAtmosphere() {
  return (
    <div
      className="landing-hero-atmosphere pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="landing-hero-blob landing-hero-blob--a absolute -left-[12%] -top-[18%] h-[58vmin] w-[58vmin] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.22),transparent_68%)] blur-2xl" />
      <div className="landing-hero-blob landing-hero-blob--b absolute -right-[8%] top-[8%] h-[52vmin] w-[52vmin] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,252,0.85),transparent_70%)] blur-3xl" />
      <div className="landing-hero-blob landing-hero-blob--c absolute bottom-[-20%] left-[28%] h-[48vmin] w-[62vmin] rounded-full bg-[radial-gradient(circle_at_center,rgba(141,138,131,0.28),transparent_72%)] blur-3xl" />
      <div className="landing-hero-blob landing-hero-blob--d absolute right-[18%] bottom-[12%] h-[28vmin] w-[28vmin] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.14),transparent_70%)] blur-xl" />
      <div className="landing-grain absolute inset-0 opacity-[0.4]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_40%,rgba(232,232,230,0.55)_100%)]" />
    </div>
  );
}
