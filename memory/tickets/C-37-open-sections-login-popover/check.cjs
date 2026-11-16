const fs=require("fs");
const h=fs.readFileSync("E:/Applications/OfficeTemp/memory/tickets/C-37-open-sections-login-popover/home.html","utf8");
console.log("Профиль in nav?", h.includes(">Профиль<"));
console.log("LoginPopover", h.includes("Вход без перехода") || h.includes("Личный кабинет"));
console.log("Шаблоны", h.includes("/app/templates"));
console.log("no /app profile link as first?", /href="\/app"/.test(h) && !h.includes('href="/app/templates"'));
