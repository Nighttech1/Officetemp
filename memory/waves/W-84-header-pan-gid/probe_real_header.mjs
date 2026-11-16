/**
 * Render real Накладная1 template with docx-preview in Chromium and dump header img metrics.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT = path.resolve("e:/Applications/OfficeTemp/memory/waves/W-84-header-pan-gid");
const templatesDir = "e:/Applications/OfficeTemp/templates";
const tpl = fs.readdirSync(templatesDir).find((f) => f.includes("09.09.26") && f.endsWith(".docx"));
if (!tpl) throw new Error("template not found");
const tplPath = path.join(templatesDir, tpl);
const buf = fs.readFileSync(tplPath);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.setContent(`<!doctype html>
<html><head>
<meta charset="utf-8"/>
<style>
  body{margin:0;background:#222;font:14px sans-serif}
  #host{background:#fff;margin:20px;overflow:visible}
  /* current app CSS subset */
  .docx-waybill-preview{overflow:visible!important;background:#fff}
  .docx-waybill-preview .docx-wrapper{background:#fff!important;overflow:visible!important;padding:0!important}
  .docx-waybill-preview section.docx{overflow:visible!important;background:#fff!important}
  .docx-waybill-preview img{max-width:100%;height:auto}
  .docx-waybill-preview header,.docx-waybill-preview footer,
  .docx-waybill-preview [class*="header"],.docx-waybill-preview [class*="footer"]{
    display:block!important;visibility:visible!important;opacity:1!important;
    overflow:visible!important;position:relative!important;z-index:1;
    min-height:unset!important;height:auto!important;
  }
  .docx-waybill-preview header img,.docx-waybill-preview footer img{
    display:inline-block!important;max-width:100%!important;width:auto!important;height:auto!important;
  }
</style>
</head><body>
<div id="host" class="docx-waybill-preview"></div>
<script src="https://unpkg.com/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="https://unpkg.com/docx-preview@0.4.1/dist/docx-preview.min.js"></script>
</body></html>`);

await page.waitForFunction(() => window.docx?.renderAsync);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
await page.evaluate(async (bytes) => {
  const u8 = new Uint8Array(bytes);
  await window.docx.renderAsync(u8.buffer, document.getElementById("host"), undefined, {
    className: "docx-preview-host",
    inWrapper: true,
    ignoreWidth: false,
    ignoreHeight: true,
    breakPages: true,
    ignoreLastRenderedPageBreak: false,
    useBase64URL: true,
    renderHeaders: true,
    renderFooters: true,
  });
}, [...buf]);

await page.waitForTimeout(500);
const meta = await page.evaluate(() => {
  const host = document.getElementById("host");
  const headers = [...host.querySelectorAll("header, [class*='header']")].filter(
    (el) => el.tagName === "HEADER" || /header/i.test(String(el.className)),
  );
  const allImgs = [...host.querySelectorAll("img")];
  const headerImgs = headers.flatMap((h) => [...h.querySelectorAll("img")]);
  const dump = (img) => {
    const cs = getComputedStyle(img);
    const parent = img.parentElement;
    const pcs = parent ? getComputedStyle(parent) : null;
    return {
      natural: [img.naturalWidth, img.naturalHeight],
      offset: [img.offsetWidth, img.offsetHeight],
      client: [img.clientWidth, img.clientHeight],
      display: cs.display,
      visibility: cs.visibility,
      position: cs.position,
      top: cs.top,
      left: cs.left,
      maxWidth: cs.maxWidth,
      srcLen: (img.getAttribute("src") || "").length,
      srcPrefix: (img.getAttribute("src") || "").slice(0, 40),
      parentTag: parent?.tagName,
      parentClass: parent?.className?.toString?.()?.slice(0, 80),
      parentPos: pcs?.position,
      parentOverflow: pcs?.overflow,
      parentWH: parent ? [parent.offsetWidth, parent.offsetHeight] : null,
      parentStyle: parent?.getAttribute("style")?.slice(0, 200),
    };
  };
  return {
    headerCount: headers.length,
    headerHTML: headers.slice(0, 1).map((h) => h.outerHTML.slice(0, 1500)),
    headerStyles: headers.slice(0, 1).map((h) => {
      const cs = getComputedStyle(h);
      return {
        h: h.offsetHeight,
        w: h.offsetWidth,
        overflow: cs.overflow,
        position: cs.position,
        minHeight: cs.minHeight,
        styleAttr: h.getAttribute("style")?.slice(0, 300),
      };
    }),
    headerImgs: headerImgs.map(dump),
    allImgCount: allImgs.length,
    allImgs: allImgs.slice(0, 5).map(dump),
    sectionOverflow: [...host.querySelectorAll("section.docx")].slice(0, 1).map((s) => getComputedStyle(s).overflow),
  };
});

fs.writeFileSync(path.join(OUT, "probe_real_header.json"), JSON.stringify(meta, null, 2));
await page.screenshot({ path: path.join(OUT, "probe_real_header.png"), fullPage: true });
console.log(JSON.stringify(meta, null, 2));
await browser.close();
