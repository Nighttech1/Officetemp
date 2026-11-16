"""Render real Накладная1 with docx-preview; dump header image metrics."""
from __future__ import annotations

import base64
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-84-header-pan-gid")
tpl = next(Path(r"e:\Applications\OfficeTemp\templates").glob("*09.09.26.docx"))
b64 = base64.b64encode(tpl.read_bytes()).decode("ascii")

HTML = """<!doctype html>
<html><head><meta charset="utf-8"/>
<style>
  body{margin:0;background:#222}
  #host{background:#fff;margin:20px;overflow:visible}
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
</style></head><body>
<div id="host" class="docx-waybill-preview"></div>
<script src="https://unpkg.com/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="https://unpkg.com/docx-preview@0.4.1/dist/docx-preview.min.js"></script>
</body></html>"""

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1200, "height": 900})
    page.set_content(HTML, wait_until="domcontentloaded")
    page.wait_for_function("() => window.docx && window.docx.renderAsync")
    page.evaluate(
        """async (b64) => {
          const bin = atob(b64);
          const u8 = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
          const host = document.getElementById('host');
          await window.docx.renderAsync(u8.buffer, host, undefined, {
            className: 'docx-preview-host',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: true,
            breakPages: true,
            ignoreLastRenderedPageBreak: false,
            useBase64URL: true,
            renderHeaders: true,
            renderFooters: true,
          });
          // same fix as WaybillLivePreview.fixFloatingHeaderImages
          const imgs = [...host.querySelectorAll('header img, footer img')];
          const section = host.querySelector('section.docx');
          const pageW = Math.max(section?.clientWidth || 0, host.clientWidth || 0, 320);
          for (const img of imgs) {
            if (!img.naturalWidth || img.naturalWidth < 8) continue;
            const displayW = Math.min(img.naturalWidth, pageW);
            const displayH = Math.max(1, Math.round((img.naturalHeight * displayW) / img.naturalWidth));
            img.style.maxWidth = 'none';
            img.style.width = displayW + 'px';
            img.style.height = displayH + 'px';
            img.style.position = 'static';
            img.style.display = 'block';
            const wrap = img.parentElement;
            if (wrap) {
              wrap.style.width = displayW + 'px';
              wrap.style.height = displayH + 'px';
              wrap.style.left = '0';
              wrap.style.top = '0';
              wrap.style.position = 'relative';
              wrap.style.display = 'block';
            }
            const band = img.closest('header, footer');
            if (band) {
              band.style.marginTop = '0';
              band.style.minHeight = displayH + 'px';
              band.style.height = 'auto';
            }
          }
        }""",
        b64,
    )
    page.wait_for_timeout(500)
    meta = page.evaluate(
        """() => {
          const host = document.getElementById('host');
          const headers = [...host.querySelectorAll('header, [class*=\"header\"]')].filter(
            (el) => el.tagName === 'HEADER' || /header/i.test(String(el.className))
          );
          const dump = (img) => {
            const cs = getComputedStyle(img);
            const parent = img.parentElement;
            const pcs = parent ? getComputedStyle(parent) : null;
            return {
              natural: [img.naturalWidth, img.naturalHeight],
              offset: [img.offsetWidth, img.offsetHeight],
              display: cs.display,
              visibility: cs.visibility,
              position: cs.position,
              top: cs.top,
              left: cs.left,
              maxWidth: cs.maxWidth,
              srcLen: (img.getAttribute('src') || '').length,
              srcPrefix: (img.getAttribute('src') || '').slice(0, 48),
              parentTag: parent && parent.tagName,
              parentClass: parent && String(parent.className).slice(0, 100),
              parentPos: pcs && pcs.position,
              parentOverflow: pcs && pcs.overflow,
              parentWH: parent ? [parent.offsetWidth, parent.offsetHeight] : null,
              parentStyle: parent && (parent.getAttribute('style') || '').slice(0, 240),
            };
          };
          const headerImgs = headers.flatMap((h) => [...h.querySelectorAll('img')]);
          const allImgs = [...host.querySelectorAll('img')];
          return {
            headerCount: headers.length,
            headerStyles: headers.slice(0, 2).map((h) => {
              const cs = getComputedStyle(h);
              return {
                h: h.offsetHeight, w: h.offsetWidth,
                overflow: cs.overflow, position: cs.position,
                minHeight: cs.minHeight,
                styleAttr: (h.getAttribute('style') || '').slice(0, 400),
                html: h.outerHTML.slice(0, 1800),
              };
            }),
            headerImgs: headerImgs.map(dump),
            allImgCount: allImgs.length,
            allImgs: allImgs.slice(0, 6).map(dump),
          };
        }"""
    )
    (OUT / "probe_real_header.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    page.screenshot(path=str(OUT / "probe_real_header.png"), full_page=True)
    print(json.dumps(meta, ensure_ascii=False, indent=2))
    browser.close()
