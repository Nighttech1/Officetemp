from pathlib import Path
import json
from playwright.sync_api import sync_playwright

OUT = Path("memory/waves/W-63-landing-polish")
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://127.0.0.1:3000/?w63=2"

def main():
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        page = b.new_page(viewport={"width": 1440, "height": 900})
        page.goto(URL, wait_until="networkidle", timeout=90000)
        page.wait_for_timeout(900)
        page.screenshot(path=str(OUT / "after-hero-1440.png"))

        data = page.evaluate(
            """() => {
          const nav = document.querySelector('header.landing-nav');
          const hero = document.querySelector('.landing-hero');
          const cta = [...document.querySelectorAll('a')].find(a => (a.textContent||'').includes('Начать'));
          const demo = [...document.querySelectorAll('a,button')].some(el => (el.textContent||'').includes('демо'));
          const stats = document.querySelectorAll('[aria-labelledby=intro-product-title] li');
          const arrows = [...document.querySelectorAll('#use-cases button')].filter(b => {
            const t = (b.textContent||'').trim();
            return t === '←' || t === '→';
          });
          return {
            navBg: nav ? getComputedStyle(nav).backgroundColor : null,
            heroBg: hero ? getComputedStyle(hero).backgroundColor : null,
            navHeroMatch: nav && hero ? getComputedStyle(nav).backgroundColor === getComputedStyle(hero).backgroundColor : false,
            ctaBg: cta ? getComputedStyle(cta).backgroundColor : null,
            hasDemoBtn: demo,
            statsCount: stats.length,
            arrowButtons: arrows.length,
            faqShimmer: !!document.querySelector('.faq-shimmer-card'),
            capsDark: document.querySelector('#capabilities')
              ? getComputedStyle(document.querySelector('#capabilities')).backgroundColor
              : null,
            footerHasCta: !!(document.querySelector('footer a.landing-shimmer-cta') || [...document.querySelectorAll('footer a')].some(a => (a.textContent||'').includes('Начать'))),
          };
        }"""
        )

        page.locator("header div.hidden.md\\:flex.shrink-0 button[aria-haspopup=dialog]").hover()
        page.wait_for_timeout(450)
        loginBits = page.evaluate(
            """() => {
          const all = [...document.querySelectorAll('[role=dialog]')];
          const visible = all.find(d => {
            const s = getComputedStyle(d);
            return s.opacity !== '0' && s.visibility !== 'hidden';
          });
          if (!visible) return { open: false };
          const t = visible.innerText || '';
          return {
            open: true,
            hasExtraTitle: /DocSaaS/.test(t) && t.split('\\n').length > 6,
            hasPasswordInput: !!visible.querySelector('input[type=password]'),
            hasEmailInput: !!visible.querySelector('input[name=email], input[type=text]'),
            lineCount: t.split('\\n').filter(Boolean).length,
          };
        }"""
        )
        page.screenshot(path=str(OUT / "after-login-popover.png"))

        page.locator('header [aria-label="Разделы сервиса"] button').first.hover()
        page.wait_for_timeout(400)
        mega = page.evaluate(
            """() => {
          const panels = [...document.querySelectorAll('[aria-label=\"Разделы сервиса\"] [role=dialog]')];
          const open = panels.find(d => getComputedStyle(d).opacity !== '0');
          return { megaOpen: !!open, megaText: open ? (open.innerText||'').slice(0,80) : '' };
        }"""
        )
        page.screenshot(path=str(OUT / "after-mega.png"))

        for sel, name in [
            ("#use-cases", "after-usecases.png"),
            ("#capabilities", "after-capabilities.png"),
            ("#faq", "after-faq.png"),
            ("footer", "after-footer.png"),
            ("[aria-labelledby=intro-product-title]", "after-intro-stats.png"),
        ]:
            page.locator(sel).scroll_into_view_if_needed()
            page.wait_for_timeout(350)
            page.screenshot(path=str(OUT / name))

        b.close()
        report = {**data, "login": loginBits, **mega}
        (OUT / "probe.json").write_text(
            json.dumps(report, ensure_ascii=True, indent=2), encoding="utf-8"
        )
        print(json.dumps(report, ensure_ascii=True, indent=2))

if __name__ == "__main__":
    main()
