const fs = require("fs");
const path = require("path");
async function main() {
  let puppeteer;
  try {
    puppeteer = require("E:/Applications/OfficeTemp/frontend/node_modules/puppeteer-core");
  } catch {
    try {
      const { chromium } = require("E:/Applications/OfficeTemp/frontend/node_modules/playwright");
      const browser = await chromium.launch({
        executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
        headless: true,
      });
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
      await page.waitForTimeout(2000);
      const metrics = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        bodyHeight: document.body.scrollHeight,
        creamEls: document.querySelectorAll(".bg-landing-cream, [class*=landing-cream]").length,
        creamDisplay: [...document.querySelectorAll("[class*=landing-cream]")].slice(0,3).map(el => ({
          tag: el.tagName,
          h: el.getBoundingClientRect().height,
          top: el.getBoundingClientRect().top + window.scrollY,
          opacity: getComputedStyle(el).opacity,
          bg: getComputedStyle(el).backgroundColor,
        })),
      }));
      console.log(JSON.stringify(metrics, null, 2));
      await page.screenshot({ path: "E:/Applications/OfficeTemp/memory/waves/W-12-landing-cinema/screens/d-fullpage.png", fullPage: true });
      await browser.close();
      return;
    } catch (e) {
      console.error("playwright fail", e.message);
    }
  }
  console.log("no browser automation");
}
main();
