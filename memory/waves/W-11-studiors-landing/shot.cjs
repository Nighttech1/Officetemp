const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const outDir = "e:\\Applications\\OfficeTemp\\memory\\waves\\W-11-studiors-landing\\screens";
fs.mkdirSync(outDir, { recursive: true });
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const shots = [
  ["desktop-hero.png", "1440,900"],
  ["mobile-hero.png", "390,844"],
];
for (const [name, size] of shots) {
  const out = path.join(outDir, name);
  execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--virtual-time-budget=4000",
      `--window-size=${size}`,
      `--screenshot=${out}`,
      "http://127.0.0.1:3000/",
    ],
    { stdio: "inherit" },
  );
  console.log(name, fs.existsSync(out) ? fs.statSync(out).size : 0);
}
