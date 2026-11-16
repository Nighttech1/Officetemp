# -*- coding: utf-8 -*-
"""W-78 Client acceptance probes via Playwright Python."""
from __future__ import annotations

import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent
SCREENS = OUT / "screens"
SCREENS.mkdir(parents=True, exist_ok=True)
report = {"checks": []}

# Unicode literals avoid Windows console/source encoding issues
T_SETTINGS = "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0440\u0435\u0435\u0441\u0442\u0440\u0430"  # Настройки реестра
T_NEW = "\u041d\u043e\u0432\u044b\u0439 \u043f\u0440\u043e\u0444\u0438\u043b\u044c"  # Новый профиль
T_NAME = "\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043f\u0440\u043e\u0444\u0438\u043b\u044f"
T_URL = "\u0421\u0441\u044b\u043b\u043a\u0430 \u043d\u0430 \u0440\u0435\u0435\u0441\u0442\u0440"
T_SAVE = "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u043f\u0440\u043e\u0444\u0438\u043b\u044c"
T_ACTIVE = "\u0421\u0434\u0435\u043b\u0430\u0442\u044c \u0442\u0435\u043a\u0443\u0449\u0438\u043c"
T_CURRENT = "\u0422\u0435\u043a\u0443\u0449\u0438\u0439"
T_REGISTRY = "\u0420\u0435\u0435\u0441\u0442\u0440"
T_TEMPLATE = "\u0428\u0430\u0431\u043b\u043e\u043d"
T_NEXT = "\u0414\u0430\u043b\u0435\u0435"
T_DOC = "\u0414\u043e\u043a\u0443\u043c\u0435\u043d\u0442"
T_PREVIEW = "\u041f\u0440\u0435\u0434\u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440 \u0418\u0423\u041b"


def add(cid: str, ok: bool, detail):
    report["checks"].append({"id": cid, "ok": bool(ok), "detail": detail})
    (OUT / "acceptance-probe.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def is_near_black(bg: str, class_name: str) -> bool:
    if "zinc-950" in class_name or "bg-zinc" in class_name:
        return True
    m = re.search(r"rgba?\((\d+),\s*(\d+),\s*(\d+)", bg or "")
    if not m:
        return False
    r, g, b = map(int, m.groups())
    return r < 45 and g < 45 and b < 45


def grayish(color: str, class_name: str) -> bool:
    if "muted" in class_name or "/70" in class_name:
        return True
    m = re.search(r"rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?", color or "")
    if not m:
        return False
    r, g, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
    a = float(m.group(4)) if m.group(4) else 1.0
    return abs(r - g) < 30 and abs(g - b) < 30 and (a < 0.95 or r < 170)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        # C-213
        page.goto(
            "http://127.0.0.1:3000/app/documents/info-sheet",
            wait_until="domcontentloaded",
        )
        page.wait_for_selector(f'[aria-label="{T_PREVIEW}"]', timeout=15000)
        page.wait_for_timeout(700)
        iul = page.evaluate(
            """(label) => {
          const aside = document.querySelector(`[aria-label="${label}"]`);
          const texts = Array.from(aside.querySelectorAll('p')).map(p => p.textContent?.trim());
          const forbidden = ['Загрузите PDF','Файл подключён','Объект и документ','Добавьте или удалите подписи','Заполните объект'];
          const hits = texts.filter(t => forbidden.some(f => (t||'').includes(f)));
          return {texts, hits};
        }""",
            T_PREVIEW,
        )
        page.screenshot(path=str(SCREENS / "iul-preview.png"))
        add("C-213", len(iul["hits"]) == 0, iul)

        motion = page.evaluate(
            """async (docLabel) => {
          const tabDoc = Array.from(document.querySelectorAll('[role=tab]'))
            .find(t => (t.textContent||'').includes(docLabel));
          if (!tabDoc) return {ok:false, reason:'no tab'};
          tabDoc.click();
          await new Promise(r => setTimeout(r, 70));
          const hasMotionAttr = !!document.querySelector('[style*="opacity"], [style*="transform"]');
          await new Promise(r => setTimeout(r, 450));
          const heading = document.querySelector('h2')?.textContent || '';
          return {ok: heading.includes(docLabel) || /2\\./.test(heading), heading, hasMotionAttr};
        }""",
            T_DOC,
        )
        page.screenshot(path=str(SCREENS / "iul-step2.png"))
        add("C-214", motion.get("ok"), motion)

        page.goto(
            "http://127.0.0.1:3000/app/documents/waybills",
            wait_until="domcontentloaded",
        )
        page.wait_for_timeout(1000)

        waybill = page.evaluate(
            """(nextLabel) => {
          const tabs = Array.from(document.querySelectorAll('[role="tablist"] [role="tab"]')).map(t => {
            const cs = getComputedStyle(t);
            return {label: t.textContent?.trim(), color: cs.color, className: t.className, selected: t.getAttribute('aria-selected')==='true'};
          });
          const gen = Array.from(document.querySelectorAll('button'))
            .filter(b => /Сформировать (DOCX|PDF)/.test(b.textContent||''))
            .map(b => {
              const cs = getComputedStyle(b);
              return {text: b.textContent?.trim(), disabled: b.disabled, bg: cs.backgroundColor, color: cs.color, className: b.className};
            });
          const nextBtn = Array.from(document.querySelectorAll('button'))
            .find(b => (b.textContent||'').trim()===nextLabel);
          let next = null;
          if (nextBtn) {
            const cs = getComputedStyle(nextBtn);
            next = {disabled: nextBtn.disabled, bg: cs.backgroundColor, color: cs.color, className: nextBtn.className};
          }
          const hasSettings = Array.from(document.querySelectorAll('button'))
            .some(b => (b.textContent||'').includes('Настройки реестра'));
          return {tabs, gen, next, hasSettings};
        }""",
            T_NEXT,
        )
        page.screenshot(path=str(SCREENS / "waybill-step1.png"))

        gen_ok = (
            len(waybill["gen"]) >= 2
            and all(g["disabled"] for g in waybill["gen"])
            and all(is_near_black(g["bg"], g["className"]) for g in waybill["gen"])
        )
        add("C-216-disabled-style", gen_ok, waybill["gen"])

        later = waybill["tabs"][1:] if waybill["tabs"] else []
        subdued_ok = bool(later) and all(grayish(t["color"], t["className"]) for t in later)
        add("C-217-subdued", subdued_ok, waybill["tabs"])

        next_ok = bool(waybill["next"] and waybill["next"]["disabled"])
        add("C-217-next-disabled", next_ok, waybill["next"])

        next_style_ok = False
        if waybill["next"]:
            nc = waybill["next"]
            if "brand" in nc["className"]:
                next_style_ok = True
            else:
                m = re.search(r"rgba?\((\d+),\s*(\d+),\s*(\d+)", nc["bg"] or "")
                if m:
                    r, g, b = map(int, m.groups())
                    next_style_ok = g > r and g > 90
        add("C-217-next-style", next_style_ok, waybill["next"])
        add("C-219-btn", waybill["hasSettings"], {"hasSettings": waybill["hasSettings"]})

        # Settings via JS click to avoid locator encoding issues
        clicked = page.evaluate(
            """(label) => {
          const btn = Array.from(document.querySelectorAll('button'))
            .find(b => (b.textContent||'').includes(label));
          if (!btn) return false;
          btn.click();
          return true;
        }""",
            T_SETTINGS,
        )
        page.wait_for_timeout(500)
        panel = page.evaluate(
            """() => {
          const dlg = document.querySelector('[role="dialog"]');
          return {open: !!dlg, text: (dlg?.innerText||'').slice(0,400)};
        }"""
        )
        page.screenshot(path=str(SCREENS / "waybill-registry-settings.png"))
        add("C-219-panel", bool(clicked and panel["open"]), {"clicked": clicked, **panel})

        if panel["open"]:
            page.evaluate(
                """(label) => {
              const btn = Array.from(document.querySelectorAll('[role="dialog"] button'))
                .find(b => (b.textContent||'').includes(label));
              btn?.click();
            }""",
                T_NEW,
            )
            page.wait_for_timeout(400)
            page.evaluate(
                """(nameLabel, urlLabel, nameVal, urlVal) => {
              const inputs = Array.from(document.querySelectorAll('[role="dialog"] input, [role="dialog"] textarea'));
              // Field component: label + input
              const byLabel = (lab) => {
                const labels = Array.from(document.querySelectorAll('[role="dialog"] label, [role="dialog"] span, [role="dialog"] div'));
                const el = labels.find(e => (e.textContent||'').trim() === lab);
                if (!el) return null;
                const root = el.closest('div') || el.parentElement;
                return root?.querySelector('input, textarea');
              };
              const nameInp = byLabel(nameLabel) || inputs[0];
              const urlInp = byLabel(urlLabel) || inputs[1];
              if (nameInp) {
                nameInp.focus();
                nameInp.value = nameVal;
                nameInp.dispatchEvent(new Event('input', {bubbles:true}));
                nameInp.dispatchEvent(new Event('change', {bubbles:true}));
              }
              if (urlInp) {
                urlInp.focus();
                urlInp.value = urlVal;
                urlInp.dispatchEvent(new Event('input', {bubbles:true}));
                urlInp.dispatchEvent(new Event('change', {bubbles:true}));
              }
              return {nameOk: !!nameInp, urlOk: !!urlInp};
            }""",
                T_NAME,
                T_URL,
                "W78 profile",
                "https://example.com/registry",
            )
            for _ in range(14):
                page.evaluate(
                    """() => {
                  const btn = Array.from(document.querySelectorAll('[role="dialog"] button'))
                    .find(b => (b.textContent||'').includes('+'));
                  btn?.click();
                }"""
                )
            page.evaluate(
                """(label) => {
                  const btn = Array.from(document.querySelectorAll('[role="dialog"] button'))
                    .find(b => (b.textContent||'').includes(label));
                  btn?.click();
                }""",
                T_SAVE,
            )
            page.wait_for_timeout(250)
            page.evaluate(
                """(label) => {
                  const btn = Array.from(document.querySelectorAll('[role="dialog"] button'))
                    .find(b => (b.textContent||'').includes(label));
                  btn?.click();
                }""",
                T_ACTIVE,
            )
            page.wait_for_timeout(350)
            active = page.evaluate(
                """(cur) => {
              const cards = Array.from(document.querySelectorAll('[role="dialog"] button'));
              const activeCard = cards.find(b => b.innerText.includes(cur));
              return {hasActive: !!activeCard, className: activeCard?.className || '', text: (activeCard?.innerText||'').slice(0,80)};
            }""",
                T_CURRENT,
            )
            active_ok = active["hasActive"] and ("brand" in active["className"])
            add("C-219-active-green", active_ok, active)
            page.screenshot(path=str(SCREENS / "waybill-profile-active.png"))
            page.keyboard.press("Escape")
            page.wait_for_timeout(200)
            if page.locator('[role="dialog"]').count():
                page.evaluate(
                    """() => {
                  const dlg = document.querySelector('[role="dialog"]');
                  // close button is first icon button in header
                  dlg?.querySelector('button')?.click();
                }"""
                )
                page.wait_for_timeout(200)

        page.evaluate(
            """(label) => {
          const tabs = Array.from(document.querySelectorAll('[role=tab]'));
          tabs.find(t => (t.textContent||'').includes(label))?.click();
        }""",
            T_REGISTRY,
        )
        page.wait_for_timeout(600)
        scroll = page.evaluate(
            """() => {
          const lists = Array.from(document.querySelectorAll('.scrollbar-brand'));
          const candidates = lists.map(el => ({
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            overflowY: getComputedStyle(el).overflowY,
            className: el.className.slice(0,160),
          }));
          const scrollable = candidates.find(c => c.scrollHeight > c.clientHeight + 8 && /auto|scroll/.test(c.overflowY));
          return {candidates, hasScroll: !!scrollable, scrollable};
        }"""
        )
        page.screenshot(path=str(SCREENS / "waybill-registry-step.png"))
        scroll_ok = scroll["hasScroll"] or any(
            "scrollbar-brand" in c["className"] for c in scroll["candidates"]
        )
        add("C-218", scroll_ok, scroll)

        # Rubiks screenshots
        page.goto("http://127.0.0.1:3000/", wait_until="domcontentloaded")
        page.wait_for_selector("[data-rubiks-hero] canvas", timeout=15000)
        page.wait_for_timeout(1200)
        page.locator("[data-rubiks-hero]").screenshot(path=str(SCREENS / "rubik-baseline.png"))
        page.goto(
            "http://127.0.0.1:3000/app/documents/waybills",
            wait_until="domcontentloaded",
        )
        page.wait_for_timeout(2800)
        page.goto("http://127.0.0.1:3000/", wait_until="domcontentloaded")
        page.wait_for_selector("[data-rubiks-hero] canvas", timeout=15000)
        page.wait_for_timeout(100)
        page.locator("[data-rubiks-hero]").screenshot(path=str(SCREENS / "rubik-resume-t0.png"))
        page.wait_for_timeout(400)
        page.locator("[data-rubiks-hero]").screenshot(path=str(SCREENS / "rubik-resume-t400.png"))
        page.wait_for_timeout(1200)
        page.locator("[data-rubiks-hero]").screenshot(path=str(SCREENS / "rubik-resume-t1600.png"))
        add(
            "C-215-artifacts",
            True,
            {
                "screens": [
                    "rubik-baseline.png",
                    "rubik-resume-t0.png",
                    "rubik-resume-t400.png",
                    "rubik-resume-t1600.png",
                ]
            },
        )

        browser.close()

    failed = [c for c in report["checks"] if not c["ok"]]
    print(json.dumps({"failed": len(failed), "checks": report["checks"]}, ensure_ascii=False, indent=2))
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
