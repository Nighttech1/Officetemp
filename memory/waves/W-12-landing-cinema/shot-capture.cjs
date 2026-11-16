const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const outDir = "E:\\Applications\\OfficeTemp\\memory\\waves\\W-12-landing-cinema\\screens";
fs.mkdirSync(outDir, { recursive: true });

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const userData = path.join(outDir, "chrome-profile");
fs.mkdirSync(userData, { recursive: true });

function shot(name, w, h, url) {
  const out = path.join(outDir, name);
  execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--virtual-time-budget=5000",
      "--run-all-compositor-stages-before-draw",
      `--window-size=${w},${h}`,
      `--screenshot=${out}`,
      url,
    ],
    { stdio: "inherit" },
  );
  console.log(name, fs.existsSync(out) ? fs.statSync(out).size : 0);
}

// Tall viewports to capture mid sections without scroll API
shot("d-hero.png", 1440, 900, "http://localhost:3000/");
shot("d-tall.png", 1440, 4200, "http://localhost:3000/");
shot("m-hero.png", 390, 844, "http://localhost:3000/");
shot("m-tall.png", 390, 4200, "http://localhost:3000/");
