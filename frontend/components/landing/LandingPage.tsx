import { Hero } from "./Hero";
import { IntroProduct } from "./IntroProduct";
import { ProductTrio } from "./ProductTrio";
import { ServicesSlideshow } from "./ServicesSlideshow";
import { IntegrationsStrip } from "./IntegrationsStrip";
import { Capabilities } from "./Capabilities";
import { FaqSection } from "./FaqSection";
import { ContactCTA } from "./ContactCTA";
import { LandingMotion } from "./LandingMotion";

/** C-182: Pillars убран; ProductTrio сразу после Hero. C-184: ServicesSlideshow. */
export function LandingPage() {
  return (
    <LandingMotion>
      <div className="min-h-dvh bg-landing-grey text-landing-ink" data-landing>
        <main id="main" tabIndex={-1} className="outline-none">
          <Hero />
          <ProductTrio />
          <IntroProduct />
          <ServicesSlideshow />
          <IntegrationsStrip />
          <Capabilities />
          <FaqSection />
          <ContactCTA />
        </main>
      </div>
    </LandingMotion>
  );
}
