/**
 * W-78 Rubiks resume spin probe (Tester)
 * Usage: node probe-rubiks-resume.mjs
 */
import { chromium } from "playwright";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "screens");
fs.mkdirSync(OUT, { recursive: true });

async function meanAbsDiff(bufA, bufB) {
  const [a, b] = await Promise.all([
    sharp(bufA).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(bufB).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) return 255;
  const da = a.data;
  const db = b.data;
  let sum = 0;
  const n = da.length / 4;
  for (let i = 0; i < da.length; i += 4) {
    sum +=
      Math.abs(da[i] - db[i]) +
      Math.abs(da[i + 1] - db[i + 1]) +
      Math.abs(da[i + 2] - db[i + 2]);
  }
  return sum / (n * 3);
}

async function sampleBurst(page) {
  const loc = page.locator("[data-rubiks-hero]");
  await loc.waitFor({ state: "visible", timeout: 15000 });
  const shots = [];
  for (let i = 0; i < 6; i++) {
    shots.push(await loc.screenshot({ type: "png" }));
    await page.waitForTimeout(90);
  }
  const diffs = [];
  for (let i = 1; i < shots.length; i++) {
    diffs.push(await meanAbsDiff(shots[i - 1], shots[i]));
  }
  return {
    diffs,
    max: Math.max(...diffs),
    avg: diffs.reduce((x, y) => x + y, 0) / diffs.length,
  };
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
const baseline = await sampleBurst(page);

await page.goto("http://127.0.0.1:3000/app/documents/waybills", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(3000);

await page.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded" });
await page.waitForSelector("[data-rubiks-hero] canvas", { timeout: 15000 });
await page.waitForTimeout(80);
const resumeEarly = await sampleBurst(page);
await page.waitForTimeout(1500);
const resumeLate = await sampleBurst(page);

await page.locator("[data-rubiks-hero]").screenshot({
  path: path.join(OUT, "rubik-after-resume.png"),
});

const wild =
  resumeEarly.max > Math.max(18, baseline.max * 2.8) ||
  resumeEarly.avg > Math.max(10, baseline.avg * 2.5);

const result = {
  baseline,
  resumeEarly,
  resumeLate,
  wild,
  verdict: wild ? "FAIL_WILD_SPIN" : "PASS_STABLE",
};

fs.writeFileSync(path.join(__dirname, "rubiks-probe.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
