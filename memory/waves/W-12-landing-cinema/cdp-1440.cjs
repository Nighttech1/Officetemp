const http = require("http");
const fs = require("fs");
const { spawn } = require("child_process");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "E:\\Applications\\OfficeTemp\\memory\\waves\\W-12-landing-cinema\\screens";
const PORT = 9230;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve(JSON.parse(d)));
    }).on("error", reject);
  });
}

async function main() {
  const profile = path.join(OUT, "cdp-1440");
  fs.mkdirSync(profile, { recursive: true });
  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    "--headless=new",
    "--disable-gpu",
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: "ignore" });
  await sleep(1800);
  const version = await getJson(`http://127.0.0.1:${PORT}/json/version`);
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const i = ++id;
      pending.set(i, { resolve, reject });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result);
    }
  };

  await send("Target.setDiscoverTargets", { discover: true });
  const { targetId } = await send("Target.createTarget", { url: "http://localhost:3000/" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const s = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const i = ++id;
      pending.set(i, { resolve, reject });
      ws.send(JSON.stringify({ id: i, method, sessionId, params }));
    });

  await s("Page.enable");
  await s("Runtime.enable");
  await s("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(3500);

  const info = await s("Runtime.evaluate", {
    expression: `(() => ({
      w: window.innerWidth,
      scrollHeight: document.documentElement.scrollHeight,
      railDir: getComputedStyle(document.querySelector('[data-showcase-rail]')).flexDirection,
      cards: document.querySelectorAll('.showcase-card').length,
      processCards: document.querySelectorAll('[data-process-card]').length,
    }))()`,
    returnByValue: true,
  });
  console.log(info.result.value);

  async function shot(name, y) {
    await s("Runtime.evaluate", { expression: `window.scrollTo(0, ${y})` });
    await sleep(900);
    const { data } = await s("Page.captureScreenshot", { format: "png", fromSurface: true });
    fs.writeFileSync(path.join(OUT, name), Buffer.from(data, "base64"));
    console.log("wrote", name);
  }

  await shot("d1440-hero.png", 0);
  const showTop = await s("Runtime.evaluate", {
    expression: `document.querySelector('.landing-showcase')?.offsetTop || 1400`,
    returnByValue: true,
  });
  await shot("d1440-showcase.png", showTop.result.value);
  const methodTop = await s("Runtime.evaluate", {
    expression: `document.querySelector('#method')?.offsetTop || 5000`,
    returnByValue: true,
  });
  await shot("d1440-process.png", methodTop.result.value);
  const capTop = await s("Runtime.evaluate", {
    expression: `document.querySelector('#capabilities')?.offsetTop || 6000`,
    returnByValue: true,
  });
  await shot("d1440-capabilities.png", capTop.result.value);

  // mobile 390
  await s("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(1000);
  await s("Runtime.evaluate", { expression: `window.scrollTo(0,0)` });
  await sleep(500);
  const m = await s("Page.captureScreenshot", { format: "png", fromSurface: true });
  fs.writeFileSync(path.join(OUT, "m390-hero.png"), Buffer.from(m.data, "base64"));
  console.log("wrote m390-hero.png");

  chrome.kill();
  ws.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
