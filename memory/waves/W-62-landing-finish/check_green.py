from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://127.0.0.1:3000/?c=2", wait_until="networkidle")
    page.wait_for_timeout(600)
    r = page.evaluate(
        """() => {
      const figs = [...document.querySelectorAll('.assembly-fig, [class*=assembly]')];
      const colored = figs.map(el => ({
        cls: (el.className||'').toString().slice(0,40),
        bg: getComputedStyle(el).backgroundColor,
        w: Math.round(el.getBoundingClientRect().width),
      })).filter(x => x.bg.includes('34, 197') || x.bg.includes('45, 212') || x.w>30);
      const brandEls = [...document.querySelectorAll('*')].filter(el => {
        const bg = getComputedStyle(el).backgroundColor;
        return bg === 'rgb(34, 197, 94)' || bg === 'rgb(45, 212, 191)';
      }).slice(0,8).map(el => ({tag: el.tagName, text: (el.textContent||'').trim().slice(0,30), bg: getComputedStyle(el).backgroundColor}));
      return { colored, brandEls, css: getComputedStyle(document.documentElement).getPropertyValue('--color-brand').trim() };
    }"""
    )
    print(r)
    b.close()
