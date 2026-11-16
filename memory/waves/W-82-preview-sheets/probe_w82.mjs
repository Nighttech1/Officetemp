/**
 * W-82 Client Playwright: preview chrome + cloud connect UI
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "visual");
fs.mkdirSync(OUT, { recursive: true });

const report = { checks: [], at: new Date().toISOString() };
function add(id, ok, detail) {
  report.checks.push({ id, ok, detail });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://127.0.0.1:3000/app/documents/waybills", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.waitForTimeout(1200);

// Open first document in tree if present
const treeBtn = page.locator('[data-tree-item], button, [role="treeitem"]').filter({
  hasText: /Накладн|docx|шаблон/i,
}).first();
if (await treeBtn.count()) {
  await treeBtn.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
}

const preview = page.locator('[aria-label="Предпросмотр накладной"]');
await preview.waitFor({ timeout: 20000 }).catch(() => {});

const metrics = await page.evaluate(() => {
  const aside = document.querySelector('[aria-label="Предпросмотр накладной"]');
  if (!aside) return { ok: false, reason: "no preview aside" };
  const viewport = aside.querySelector(".docx-preview-viewport");
  const toolbar = aside.querySelector(".docx-preview-toolbar");
  const a4 = aside.querySelector(".docx-a4-frame");
  const borders = [];
  aside.querySelectorAll("*").forEach((el) => {
    const cs = getComputedStyle(el);
    const bw =
      parseFloat(cs.borderTopWidth) +
      parseFloat(cs.borderRightWidth) +
      parseFloat(cs.borderBottomWidth) +
      parseFloat(cs.borderLeftWidth);
    if (bw >= 3 && el !== aside) {
      borders.push({
        tag: el.tagName,
        className: String(el.className).slice(0, 80),
        bw,
      });
    }
  });
  const tCs = toolbar ? getComputedStyle(toolbar) : null;
  return {
    ok: true,
    hasViewport: !!viewport,
    hasToolbar: !!toolbar,
    hasLegacyA4Frame: !!a4,
    toolbarPosition: tCs?.position || null,
    toolbarTop: tCs?.top || null,
    toolbarRight: tCs?.right || null,
    zoomLabel: toolbar?.querySelector("span")?.textContent?.trim() || null,
    nestedHeavyBorders: borders.slice(0, 12),
    headerCount: aside.querySelectorAll("header, [class*='header']").length,
    footerCount: aside.querySelectorAll("footer, [class*='footer']").length,
  };
});

add(
  "C-820-toolbar-overlay",
  Boolean(
    metrics.ok &&
      metrics.hasToolbar &&
      metrics.toolbarPosition === "absolute" &&
      !metrics.hasLegacyA4Frame,
  ),
  metrics,
);

// Step 2 cloud UI
const dataTab = page.getByRole("tab", { name: /Данные/i }).first();
if (await dataTab.count()) {
  await dataTab.click();
  await page.waitForTimeout(500);
}

const cloudOpen = page.getByRole("button", { name: /Облачная таблица/i }).first();
if (await cloudOpen.count()) {
  await cloudOpen.click().catch(() => {});
  await page.waitForTimeout(400);
}

const connectBtn = page.getByRole("button", { name: /Подключить|подключаемся/i }).first();
const hasConnect = (await connectBtn.count()) > 0;
add("C-822-connect-visible", hasConnect, {
  text: hasConnect ? await connectBtn.innerText() : null,
});

// Contour class exists in stylesheet
const hasContourCss = await page.evaluate(() => {
  const sheets = [...document.styleSheets];
  for (const s of sheets) {
    try {
      for (const rule of s.cssRules || []) {
        if (rule.cssText && rule.cssText.includes("cloud-connect-contour")) {
          return true;
        }
      }
    } catch {
      /* cors */
    }
  }
  return !!document.querySelector(".cloud-connect-contour");
});
add("C-822-contour-css", hasContourCss, { hasContourCss });

await page.screenshot({
  path: path.join(OUT, "waybill-preview-after.png"),
  fullPage: false,
});

await browser.close();
fs.writeFileSync(path.join(__dirname, "playwright-w82.json"), JSON.stringify(report, null, 2));
const failed = report.checks.filter((c) => !c.ok);
console.log(JSON.stringify(report, null, 2));
process.exit(failed.length ? 1 : 0);
