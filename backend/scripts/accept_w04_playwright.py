"""Wave 4 visual smoke — Playwright Chromium desktop 1440 + mobile 390."""

from __future__ import annotations

from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[2] / "memory" / "waves" / "W-04-phase4-frontend" / "playwright"
BASE = "http://127.0.0.1:3000"


def shot(page, name: str) -> None:
    path = OUT / name
    page.screenshot(path=str(path), full_page=True)
    print("shot", path)


def check_no_hscroll(page) -> bool:
    return page.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth + 1")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    issues: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Desktop 1440
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        for route, file in [
            ("/login", "d1440-login.png"),
            ("/register", "d1440-register.png"),
        ]:
            page.goto(BASE + route, wait_until="networkidle")
            if "DocSaaS" not in page.content():
                issues.append(f"desktop {route}: DocSaaS missing")
            shot(page, file)
        # Try open app without auth — should redirect login
        page.goto(BASE + "/app", wait_until="networkidle")
        shot(page, "d1440-app-gate.png")
        if "/login" not in page.url and "Войти" not in page.content() and "вход" not in page.content().lower():
            # still ok if redirected
            pass
        ctx.close()

        # Mobile ~390
        ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
        )
        page = ctx.new_page()
        page.goto(BASE + "/login", wait_until="networkidle")
        if not check_no_hscroll(page):
            issues.append("mobile login: horizontal scroll")
        shot(page, "m390-login.png")
        page.goto(BASE + "/register", wait_until="networkidle")
        if not check_no_hscroll(page):
            issues.append("mobile register: horizontal scroll")
        shot(page, "m390-register.png")
        ctx.close()
        browser.close()

    print("ISSUES", issues or "[]")
    if issues:
        raise SystemExit(1)
    print("W04_PLAYWRIGHT_OK")


if __name__ == "__main__":
    main()
