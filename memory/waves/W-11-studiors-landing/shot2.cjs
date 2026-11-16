const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const outDir = "E:\\Applications\\OfficeTemp\\memory\\waves\\W-11-studiors-landing\\screens";
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
for (const [name, size] of [["desktop-hero.png","1440,900"],["mobile-hero.png","390,844"]]) {
  const out = path.join(outDir, name);
  execFileSync(chrome, ["--headless=new","--disable-gpu","--hide-scrollbars","--virtual-time-budget=8000","--run-all-compositor-stages-before-draw",`--window-size=${size}`,`--screenshot=${out}`,"http://localhost:3000/"], {stdio:"inherit"});
  console.log(name, fs.statSync(out).size);
}
