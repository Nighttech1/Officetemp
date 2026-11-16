/**
 * W-88 live probe — waybill wizard P0 checklist on localhost:3000
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "playwright-w88.json");
const SHOT = path.join(__dirname, "after-desktop.png");
const BASE = "http://127.0.0.1:3000";
const TEMPLATE = (() => {
  const dir = "e:/Applications/OfficeTemp/templates";
  const files = fs.readdirSync(dir).filter(
    (f) => f.includes("09.09.26") && f.endsWith(".docx") && !f.startsWith("~$"),
  );
  return files[0] ? path.join(dir, files[0]) : null;
})();

const result = {
  ok: false,
  checks: {},
  errors: [],
  ts: new Date().toISOString(),
};

function note(key, pass, detail) {
  result.checks[key] = { pass, detail };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(45000);

  try {
    await page.goto(`${BASE}/app/documents/waybills`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2500);

    // Tree / project
    const treeText = await page.locator("aside, [class*='sidebar'], nav").first().innerText().catch(() => "");
    const hasProjectHint =
      /проект|демо|накладн/i.test(treeText) ||
      (await page.getByText(/Демо-проект|Накладн/i).count()) > 0;
    note("tree_visible", hasProjectHint, treeText.slice(0, 200));

    // Step tabs
    const registryTab = page.getByRole("tab", { name: /реестр/i }).first();
    const hasRegistry = (await registryTab.count()) > 0;
    note("registry_tab_present", hasRegistry, "tab Реестр");

    if (hasRegistry) {
      await registryTab.click();
      await page.waitForTimeout(800);
      const onRegistry =
        (await page.getByText(/реестр результатов|ссылка на реестр/i).count()) > 0 ||
        (await page.getByRole("heading", { name: /реестр/i }).count()) > 0;
      note("registry_tab_opens", onRegistry, await page.locator("h2").allInnerTexts().then((t) => t.join("|")).catch(() => ""));
      // back to template
      await page.getByRole("tab", { name: /шаблон/i }).first().click().catch(() => {});
      await page.waitForTimeout(500);
    }

    // Upload template if file input exists
    if (TEMPLATE) {
      const input = page.locator('input[type="file"][accept*="docx"]').first();
      if ((await input.count()) > 0) {
        await input.setInputFiles(TEMPLATE);
        await page.waitForTimeout(4000);
        const saved = (await page.getByText(/шаблон.*сохран/i).count()) > 0;
        note("template_upload", saved, path.basename(TEMPLATE));
      } else {
        note("template_upload", false, "no file input");
      }
    } else {
      note("template_upload", false, "no template file");
    }

    // Preview metrics
    const metrics = await page.evaluate(() => {
      const vp = document.querySelector(".docx-preview-viewport");
      const host = document.querySelector(".docx-waybill-preview");
      const section = host?.querySelector("section");
      if (!vp || !host) return { missing: true };
      const style = getComputedStyle(vp);
      const overflowX = style.overflowX;
      const scrollW = vp.scrollWidth;
      const clientW = vp.clientWidth;
      const hostW = host.scrollWidth;
      const sectionW = section?.offsetWidth ?? 0;
      // rightmost content
      let maxRight = 0;
      const origin = host.getBoundingClientRect().left;
      host.querySelectorAll("*").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 1) maxRight = Math.max(maxRight, r.right - origin);
      });
      const tds = Array.from(host.querySelectorAll("td")).slice(0, 8).map((td) => getComputedStyle(td).textAlign);
      return {
        overflowX,
        scrollW,
        clientW,
        hostW,
        sectionW,
        maxRight: Math.round(maxRight),
        hScrollNeeded: scrollW > clientW + 2,
        tdAlign: tds,
        fillHint: !!document.body.innerText.match(/подставятся после выбора строк/i),
        stepLabel: document.body.innerText.match(/шаг\s*\d+\/\d+/i)?.[0] ?? null,
      };
    });
    note(
      "preview_no_hscroll_css",
      metrics.overflowX === "hidden" || metrics.overflowX === "clip",
      metrics,
    );
    note(
      "preview_width_ok",
      !metrics.missing && metrics.sectionW > 0 && metrics.maxRight <= metrics.hostW + 40,
      { sectionW: metrics.sectionW, maxRight: metrics.maxRight, hostW: metrics.hostW },
    );
    note(
      "cells_centered",
      Array.isArray(metrics.tdAlign) && metrics.tdAlign.every((a) => a === "center" || a === "start" /* empty */ || !a),
      metrics.tdAlign,
    );
    // stricter center: if we have tds, prefer center
    if (metrics.tdAlign?.length) {
      const centered = metrics.tdAlign.filter((a) => a === "center").length;
      note("cells_mostly_center", centered >= Math.ceil(metrics.tdAlign.length / 2), {
        centered,
        total: metrics.tdAlign.length,
        tdAlign: metrics.tdAlign,
      });
    }

    // Sheet multi-select presence after going to data step
    await page.getByRole("tab", { name: /данные/i }).first().click().catch(() => {});
    await page.waitForTimeout(600);
    const sheetMulti =
      (await page.getByText(/листы \(страницы\)|можно несколько/i).count()) > 0 ||
      (await page.getByLabel(/листы таблицы/i).count()) > 0;
    note("sheet_multiselect_ui", sheetMulti, "label multi sheets");

    // DOCX API smoke via page fetch after login cookie from ensureDevSession
    const docxApi = await page.evaluate(async () => {
      try {
        const login = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "admin1", password: "admin1" }),
        });
        const lj = await login.json().catch(() => ({}));
        const token = lj.access_token;
        if (!token) return { ok: false, err: "no token", status: login.status };
        // just health of generate endpoint with tiny invalid to see auth works
        const me = await fetch("/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return { ok: me.ok, status: me.status };
      } catch (e) {
        return { ok: false, err: String(e) };
      }
    });
    note("api_auth", !!docxApi.ok, docxApi);

    await page.screenshot({ path: SHOT, fullPage: false });
    note("screenshot", true, SHOT);

    const failed = Object.entries(result.checks).filter(([, v]) => !v.pass);
    result.ok = failed.length === 0;
    result.failedKeys = failed.map(([k]) => k);
  } catch (e) {
    result.errors.push(String(e?.stack || e));
  } finally {
    await browser.close();
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  }
}

main();
