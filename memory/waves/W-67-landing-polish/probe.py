from pathlib import Path
import json
from playwright.sync_api import sync_playwright

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-67-landing-polish")
OUT.mkdir(parents=True, exist_ok=True)

def main():
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        page = b.new_page(viewport={"width": 1440, "height": 900})
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))

        page.goto("http://127.0.0.1:3000/", wait_until="networkidle", timeout=120000)
        page.wait_for_timeout(1000)

        nav = page.evaluate("""() => {
          const texts = [...document.querySelectorAll('header a, header button')].map(el => (el.textContent||'').trim());
          return {
            hasAbout: texts.some(t => t.includes('О сервисе')),
            hasPlatform: texts.some(t => t === 'Платформа' || t.startsWith('Платформа')),
            hasServicesNav: texts.some(t => t === 'Услуги' || t.startsWith('Услуги')),
            hasStart: [...document.querySelectorAll('a')].some(a => (a.textContent||'').trim() === 'Начать'),
            hasStartFree: [...document.querySelectorAll('a,button')].some(el => (el.textContent||'').includes('Начать бесплатно')),
            hasLoginHero: [...document.querySelectorAll('a')].some(a => (a.textContent||'').trim() === 'Войти' && a.closest('section.landing-hero')),
          };
        }""")

        order = page.evaluate("""() => {
          const ids = [...document.querySelectorAll('main > section, main section[id], main [id=method], main [id=about], main [id=services]')]
            .map(el => el.id || el.getAttribute('aria-labelledby') || el.className.slice(0,40));
          const method = document.querySelector('#method');
          const about = document.querySelector('#about');
          const hero = document.querySelector('.landing-hero');
          const pillarsGone = !document.querySelector('#pillars-title');
          let heroBeforeMethod = false;
          if (hero && method) {
            heroBeforeMethod = hero.compareDocumentPosition(method) & Node.DOCUMENT_POSITION_FOLLOWING;
          }
          let methodBeforeAbout = false;
          if (method && about) {
            methodBeforeAbout = method.compareDocumentPosition(about) & Node.DOCUMENT_POSITION_FOLLOWING;
          }
          const trioH = method ? Math.round(method.getBoundingClientRect().height) : 0;
          return { pillarsGone, heroBeforeMethod, methodBeforeAbout, trioH, hasServices: !!document.querySelector('#services'), hasSlideshow: !!document.querySelector('#services [class*=Slideshow], #services') };
        }""")

        page.screenshot(path=str(OUT / "after-hero.png"))
        page.locator("#method").scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        page.screenshot(path=str(OUT / "after-trio.png"))
        page.locator("#services").scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        page.screenshot(path=str(OUT / "after-services.png"))
        page.locator("text=Работает с тем").scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        marquee = page.evaluate("""() => {
          const track = document.querySelector('.landing-marquee-track');
          if (!track) return null;
          const cs = getComputedStyle(track);
          return {
            anim: cs.animationName,
            width: Math.round(track.scrollWidth),
            children: track.children.length,
          };
        }""")
        page.screenshot(path=str(OUT / "after-marquee.png"))

        # contact page
        page.goto("http://127.0.0.1:3000/contact", wait_until="networkidle", timeout=90000)
        page.wait_for_timeout(600)
        contact = page.evaluate("""() => {
          const main = document.querySelector('main');
          const bg = getComputedStyle(document.body).backgroundColor;
          const h1 = document.querySelector('h1')?.textContent || '';
          const form = !!document.querySelector('form');
          const tinyOnly = main ? main.querySelectorAll(':scope > *').length <= 1 && main.getBoundingClientRect().height < 500 : true;
          return { h1, form, tinyOnly, cream: !!document.querySelector('[data-landing]') };
        }""")
        page.screenshot(path=str(OUT / "after-contact.png"))

        # landing contact CTA
        page.goto("http://127.0.0.1:3000/", wait_until="networkidle")
        page.locator("#contact").scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        cta = page.evaluate("""() => {
          const s = document.querySelector('#contact');
          const t = s ? s.innerText : '';
          return {
            hasReg: t.includes('Регистрация'),
            hasFullForm: t.includes('Полная форма'),
            hasMail: t.includes('hello@docsaas'),
          };
        }""")
        footer = page.evaluate("""() => {
          const f = document.querySelector('footer');
          return { hasStartFree: (f?.innerText||'').includes('Начать бесплатно') };
        }""")
        page.screenshot(path=str(OUT / "after-contact-cta.png"))

        # dark text contrast sample
        contrast = page.evaluate("""() => {
          const dark = document.querySelector('[data-landing-theme=black]');
          if (!dark) return null;
          const muted = [...dark.querySelectorAll('p,span')].filter(el => {
            const c = getComputedStyle(el).color;
            return c.includes('128') || c.includes('113') || c === 'rgb(161, 161, 170)';
          }).length;
          return { mutedLeft: muted };
        }""")

        report = {
            "nav": nav,
            "order": order,
            "marquee": marquee,
            "contact": contact,
            "cta": cta,
            "footer": footer,
            "contrast": contrast,
            "pageErrors": errs[:5],
        }
        (OUT / "probe.json").write_text(json.dumps(report, ensure_ascii=True, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=True, indent=2))
        b.close()

if __name__ == "__main__":
    main()
