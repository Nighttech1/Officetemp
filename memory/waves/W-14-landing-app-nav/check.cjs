const fs=require("fs");
const h=fs.readFileSync("E:/Applications/OfficeTemp/memory/waves/W-14-landing-app-nav/home.html","utf8");
const checks=["/app/templates","/app/mapper","/app/generate","/contact","/login","Личный кабинет","/app\""];
for (const c of checks) console.log(c, h.includes(c) || (c==="/app\"" && h.includes('href="/app"')));
console.log("marketing #capabilities as nav?", /href="#capabilities"/.test(h));
