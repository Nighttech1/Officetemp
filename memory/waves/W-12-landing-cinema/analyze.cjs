const fs = require("fs");
const { execFileSync } = require("child_process");
// Use sharp if available
let sharp;
try { sharp = require("E:/Applications/OfficeTemp/frontend/node_modules/sharp"); } catch (e) { console.log("no sharp", e.message); process.exit(0); }
async function analyze(file) {
  const img = sharp(file);
  const meta = await img.metadata();
  const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  let cream=0, dark=0, teal=0, bright=0;
  for (let i=0;i<data.length;i+=4) {
    const r=data[i],g=data[i+1],b=data[i+2];
    if (r>200 && g>190 && b>170) cream++;
    else if (r<40 && g<40 && b<40) dark++;
    else if (g>r && g>b && g>120) teal++;
    if (r+g+b > 500) bright++;
  }
  const px = info.width*info.height;
  console.log(file.split("\\").pop(), meta.width+"x"+meta.height, "cream%", (100*cream/px).toFixed(1), "dark%", (100*dark/px).toFixed(1), "bright%", (100*bright/px).toFixed(1));
}
(async()=>{
  await analyze("E:/Applications/OfficeTemp/memory/waves/W-12-landing-cinema/screens/d-tall.png");
  await analyze("E:/Applications/OfficeTemp/memory/waves/W-12-landing-cinema/screens/m-tall.png");
})();
