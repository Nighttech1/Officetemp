const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const outDir = "e:\\Applications\\OfficeTemp\\memory\\waves\\W-11-studiors-landing\\screens";
fs.mkdirSync(outDir, { recursive: true });

const html = fs.readFileSync(path.join(outDir, "home.html"), "utf8");
const checks = [
  "DocSaaS",
  "landing-hero",
  "/register",
  "/login",
  'id="method"',
  'id="capabilities"',
  'id="contact"',
  "router.replace",
];
for (const c of checks) {
  console.log(`${c} -> ${html.includes(c)}`);
}

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const shots = [
  ["desktop-hero.png", "1440,900"],
  ["mobile-hero.png", "390,844"],
];
for (const [name, size] of shots) {
  const out = path.join(outDir, name);
  try {
    execFileSync(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        `--window-size=${size}`,
        `--screenshot=${out}`,
        "http://127.0.0.1:3000/",
      ],
      { stdio: "inherit" },
    );
    console.log("wrote", out, fs.existsSync(out) ? fs.statSync(out).size : 0);
  } catch (e) {
    console.error("shot fail", name, e.message);
  }
}
