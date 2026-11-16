const fs=require("fs");
const h=fs.readFileSync("E:/Applications/OfficeTemp/memory/waves/W-12-landing-cinema/screens/home.html","utf8");
console.log("Formatting Breaks", h.includes("Formatting Breaks"));
console.log("RU manifesto", h.includes("Сломанная") || h.includes("\u0421\u043b\u043e\u043c\u0430\u043d\u043d\u0430\u044f"));
console.log("showcase-pin", /showcase-pin|data-showcase-pin/.test(h));
console.log("process ghost", /process-card__ghost|ghost-num|process-ghost/.test(h));
console.log("LandingMotion opacity0 CSS", /landing-reveal\s*\{\s*opacity:\s*0/.test(h));
