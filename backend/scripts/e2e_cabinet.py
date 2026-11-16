"""E2E cabinet smoke via Python Playwright (needs FE :3000; API for register flow).

Scenarios:
  - /login shows DocSaaS
  - register unique email → land on /app
  - visit /app/templates
  - no horizontal scroll at 390 on login

Env:
  E2E_BASE_URL   default http://127.0.0.1:3000
  E2E_API_URL    optional; register goes through Next → API
"""

from __future__ import annotations

import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:3000").rstrip("/")


def server_up(url: str, timeout: float = 3.0) -> bool:
    """True if FE answers. Prefer /login (root may only redirect)."""
    candidates = [url.rstrip("/") + "/login", url.rstrip("/")]
    for candidate in candidates:
        try:
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            req = urllib.request.Request(candidate, method="GET")
            with opener.open(req, timeout=timeout) as resp:
                if 200 <= resp.status < 500:
                    return True
        except (urllib.error.URLError, TimeoutError, OSError):
            continue
    return False


def check_no_hscroll(page) -> bool:
    return page.evaluate(
        "() => document.documentElement.scrollWidth <= window.innerWidth + 1"
    )


def run_e2e() -> dict:
    from playwright.sync_api import sync_playwright

    issues: list[str] = []
    email = f"e2e_{int(time.time())}_{os.getpid()}@example.com"
    password = "password123"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Desktop — login brand
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = ctx.new_page()
        page.goto(f"{BASE}/login", wait_until="networkidle", timeout=60_000)
        page.wait_for_selector('input[name="email"]', timeout=30_000)
        content = page.content()
        if "DocSaaS" not in content:
            issues.append("login: DocSaaS brand missing")

        # Register unique user (wait for client hydration before submit)
        page.goto(f"{BASE}/register", wait_until="networkidle", timeout=60_000)
        page.wait_for_selector('input[name="org_name"]', timeout=30_000)
        page.wait_for_selector('button[type="submit"]:not([disabled])', timeout=30_000)
        page.fill('input[name="org_name"]', "E2E Org")
        page.fill('input[name="full_name"]', "E2E User")
        page.fill('input[name="email"]', email)
        page.fill('input[name="password"]', password)
        # Ensure React handlers are attached: small settle + click submit
        page.wait_for_timeout(400)
        with page.expect_response(
            lambda r: "/api/v1/auth/register" in r.url and r.request.method == "POST",
            timeout=30_000,
        ) as reg_info:
            page.click('button[type="submit"]')
        reg_resp = reg_info.value
        if reg_resp.status != 201:
            issues.append(f"register API status {reg_resp.status}")
        try:
            page.wait_for_url("**/app**", timeout=30_000)
        except Exception:
            issues.append(f"register: did not reach /app (url={page.url})")

        if "/app" not in page.url:
            issues.append(f"register: expected /app, got {page.url}")
        else:
            # Visit templates
            page.goto(f"{BASE}/app/templates", wait_until="networkidle", timeout=60_000)
            page.wait_for_timeout(400)
            if "/login" in page.url:
                issues.append("templates: redirected to login (auth lost)")
            body = page.content()
            if "Шаблон" not in body and "шаблон" not in body.lower() and "DocSaaS" not in body:
                issues.append("templates: unexpected empty cabinet page")

        ctx.close()

        # Mobile 390 — no horizontal scroll on login
        ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
        )
        page = ctx.new_page()
        page.goto(f"{BASE}/login", wait_until="networkidle", timeout=60_000)
        page.wait_for_selector('input[name="email"]', timeout=30_000)
        if not check_no_hscroll(page):
            issues.append("mobile login: horizontal scroll at 390")
        ctx.close()
        browser.close()

    return {"ok": not issues, "issues": issues, "email": email, "base": BASE}


def main() -> int:
    if not server_up(BASE):
        print(f"SKIP: frontend not reachable at {BASE}")
        return 2
    result = run_e2e()
    print(result)
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
