const http = require("http");
const fs = require("fs");
const { spawn } = require("child_process");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "E:\\Applications\\OfficeTemp\\memory\\waves\\W-12-landing-cinema\\screens";
const PORT = 9229;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function main() {
  const profile = path.join(OUT, "cdp-profile");
  fs.mkdirSync(profile, { recursive: true });
  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${PORT}`,
      "--headless=new",
      "--disable-gpu",
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  await sleep(1500);
  try {
    const tabs = await getJson(`http://127.0.0.1:${PORT}/json`);
    const wsUrl = tabs[0].webSocketDebuggerUrl;
    const WebSocket = require("ws");
    // ws may not exist — use raw TCP upgrade via fetch CDP HTTP
  } catch (e) {
    console.error("cdp list fail", e.message);
  }
  chrome.kill();
}

// Simpler: use chrome print-to-pdf full page then convert — or screenshot with full page via puppeteer bundled in chrome

async function viaDevtoolsProtocol() {
  // Use fetch to /json/new
  const profile = path.join(OUT, "cdp-profile2");
  fs.mkdirSync(profile, { recursive: true });
  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${PORT}`,
      "--headless=new",
      "--disable-gpu",
      `--user-data-dir=${profile}`,
      "http://localhost:3000/",
    ],
    { stdio: "ignore" },
  );
  await sleep(2500);
  const tabs = await getJson(`http://127.0.0.1:${PORT}/json/list`);
  console.log(
    "tabs",
    tabs.map((t) => ({ title: t.title, url: t.url, type: t.type })),
  );
  // Use Page.captureScreenshot via websocket — without ws lib use chrome-remote-interface pattern with raw
  const page = tabs.find((t) => t.type === "page") || tabs[0];
  if (!page) throw new Error("no page");

  // Dynamic import undici websocket? Node 22 has global WebSocket
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const i = ++id;
      pending.set(i, { resolve, reject });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await sleep(2000);
  const metrics = await send("Runtime.evaluate", {
    expression: `(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      creamCount: document.querySelectorAll('.bg-landing-cream, .landing-showcase').length,
      sections: [...document.querySelectorAll('section')].map(s => ({
        id: s.id,
        cls: s.className.slice(0,80),
        h: Math.round(s.getBoundingClientRect().height),
        top: Math.round(s.getBoundingClientRect().top + window.scrollY),
        bg: getComputedStyle(s).backgroundColor,
        opacity: getComputedStyle(s).opacity,
      })),
    }))()`,
    returnByValue: true,
  });
  console.log(JSON.stringify(metrics.result.value, null, 2));

  const { data } = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    fromSurface: true,
  });
  fs.writeFileSync(path.join(OUT, "d-cdp-full.png"), Buffer.from(data, "base64"));
  console.log("wrote d-cdp-full.png", Buffer.from(data, "base64").length);

  // Also scroll and capture mid
  await send("Runtime.evaluate", {
    expression: `window.scrollTo(0, document.querySelector('.landing-showcase')?.offsetTop || 1200)`,
  });
  await sleep(800);
  const mid = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  fs.writeFileSync(path.join(OUT, "d-mid-showcase.png"), Buffer.from(mid.data, "base64"));
  console.log("wrote d-mid-showcase.png");

  ws.close();
  chrome.kill();
}

viaDevtoolsProtocol().catch((e) => {
  console.error(e);
  process.exit(1);
});
