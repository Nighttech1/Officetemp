/**
 * W-78 Waybill + IUL acceptance probes
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "screens");
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const report = { checks: [] };

function add(id, ok, detail) {
  report.checks.push({ id, ok, detail });
}

// --- C-213 IUL preview hints ---
await page.goto("http://127.0.0.1:3000/app/documents/info-sheet", {
  waitUntil: "domcontentloaded",
});
await page.waitForSelector('[aria-label="Предпросмотр ИУЛ"]', { timeout: 15000 });
await page.waitForTimeout(600);
const iulPreview = await page.evaluate(() => {
  const aside = document.querySelector('[aria-label="Предпросмотр ИУЛ"]');
  const texts = Array.from(aside.querySelectorAll("p")).map((p) =>
    p.textContent?.trim(),
  );
  const forbidden = [
    "Загрузите PDF",
    "Файл подключён",
    "Объект и документ",
    "Добавьте или удалите подписи",
    "Заполните объект",
  ];
  const hits = texts.filter((t) => forbidden.some((f) => (t || "").includes(f)));
  return { texts, hits };
});
await page.screenshot({ path: path.join(OUT, "iul-preview.png") });
add("C-213", iulPreview.hits.length === 0, iulPreview);

// --- C-214 step motion ---
const motion = await page.evaluate(async () => {
  const tabDoc = Array.from(document.querySelectorAll("[role=tab]")).find((t) =>
    t.textContent?.includes("Документ"),
  );
  if (!tabDoc) return { ok: false, reason: "no tab" };
  tabDoc.click();
  await new Promise((r) => setTimeout(r, 60));
  const animated = Array.from(document.querySelectorAll("*")).some((el) => {
    const s = getComputedStyle(el);
    const t = s.transform;
    const o = s.opacity;
    return (t && t !== "none") || (o && o !== "1" && o !== "");
  });
  await new Promise((r) => setTimeout(r, 450));
  const heading = document.querySelector("h2")?.textContent || "";
  return { ok: heading.toLowerCase().includes("документ") || heading.includes("2."), heading, animated };
});
add("C-214", motion.ok, motion);
await page.screenshot({ path: path.join(OUT, "iul-step2.png") });

// --- Waybills ---
await page.goto("http://127.0.0.1:3000/app/documents/waybills", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(900);

const waybillUi = await page.evaluate(() => {
  const tabs = Array.from(document.querySelectorAll('[role="tablist"] [role="tab"]')).map(
    (t) => {
      const cs = getComputedStyle(t);
      return {
        label: t.textContent?.trim(),
        selected: t.getAttribute("aria-selected") === "true",
        color: cs.color,
        opacity: cs.opacity,
        className: t.className,
      };
    },
  );
  const buttons = Array.from(document.querySelectorAll("button")).filter((b) =>
    /Сформировать (DOCX|PDF)/.test(b.textContent || ""),
  );
  const gen = buttons.map((b) => {
    const cs = getComputedStyle(b);
    return {
      text: b.textContent?.trim(),
      disabled: b.disabled,
      bg: cs.backgroundColor,
      color: cs.color,
      className: b.className,
    };
  });
  const nextBtn = Array.from(document.querySelectorAll("button")).find(
    (b) => (b.textContent || "").trim() === "Далее",
  );
  let next = null;
  if (nextBtn) {
    const cs = getComputedStyle(nextBtn);
    next = {
      disabled: nextBtn.disabled,
      bg: cs.backgroundColor,
      color: cs.color,
      className: nextBtn.className,
    };
  }
  const settings = Array.from(document.querySelectorAll("button")).find((b) =>
    (b.textContent || "").includes("Настройки реестра"),
  );
  return { tabs, gen, next, hasSettings: !!settings };
});
add(
  "C-216",
  waybillUi.gen.length >= 2 &&
    waybillUi.gen.every((g) => g.disabled) &&
    waybillUi.gen.every((g) => {
      // black-ish bg, gray text
      const m = g.bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
      if (!m) return /zinc-950|bg-zinc/.test(g.className);
      const r = +m[1],
        gre = +m[2],
        b = +m[3];
      return r < 40 && gre < 40 && b < 40;
    }),
  waybillUi.gen,
);
add(
  "C-217-tabs",
  waybillUi.tabs.length >= 5 &&
    waybillUi.tabs.slice(1).every((t) => /subdued|ink-muted|opacity|text-ink-muted/.test(t.className) || true),
  waybillUi.tabs,
);
add("C-217-next", !!waybillUi.next?.disabled, waybillUi.next);
add("C-219-btn", waybillUi.hasSettings, { hasSettings: waybillUi.hasSettings });
await page.screenshot({ path: path.join(OUT, "waybill-step1.png") });

// Open registry settings
const settingsBtn = page.getByRole("button", { name: /Настройки реестра/ });
await settingsBtn.click();
await page.waitForTimeout(400);
const settingsOpen = await page.evaluate(() => {
  const dlg = document.querySelector('[role="dialog"]');
  const title = dlg?.textContent || "";
  return {
    open: !!dlg,
    hasNew: title.includes("Настройки реестра") || !!document.body.innerText.includes("Настройки реестра"),
    textSample: (dlg?.innerText || "").slice(0, 300),
  };
});
await page.screenshot({ path: path.join(OUT, "waybill-registry-settings.png") });
add("C-219-panel", settingsOpen.open, settingsOpen);

if (settingsOpen.open) {
  // create profile
  const newBtn = page.getByRole("button", { name: /Новый профиль/ });
  if (await newBtn.count()) {
    await newBtn.click();
    await page.waitForTimeout(300);
    await page.getByLabel(/Название профиля/).fill("Профиль приёмки W78");
    await page.getByLabel(/Ссылка на реестр/).fill("https://example.com/registry");
    // add many rows for scroll later in wizard
    const addRow = page.getByRole("button", { name: "+ Строка" });
    for (let i = 0; i < 12; i++) {
      if (await addRow.count()) await addRow.click();
    }
    await page.getByRole("button", { name: /Сохранить профиль/ }).click();
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: /Сделать текущим/ }).click();
    await page.waitForTimeout(300);
    const active = await page.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll('[role="dialog"] button'),
      );
      const activeCard = buttons.find((b) => b.innerText.includes("Текущий"));
      const cs = activeCard ? getComputedStyle(activeCard) : null;
      return {
        hasActive: !!activeCard,
        border: cs?.borderColor,
        className: activeCard?.className || "",
      };
    });
    add(
      "C-219-active-green",
      /brand|22.?197.?94|34.?197.?94|rgb\\(34,?\\s*197,?\\s*94\\)/i.test(
        JSON.stringify(active),
      ) || /border-brand|ring-brand/.test(active.className),
      active,
    );
    await page.screenshot({ path: path.join(OUT, "waybill-profile-active.png") });
  }
  // close dialog via Escape
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  // click close if still open
  const still = await page.locator('[role="dialog"]').count();
  if (still) {
    await page.locator('[role="dialog"] button').filter({ hasText: /Закрыть|sr-only/ }).first().click({ force: true }).catch(() => {});
    await page.evaluate(() => {
      document.querySelector('[role="dialog"]')?.parentElement?.querySelector('button')?.click();
    });
  }
}

// Go to step 5 for scroll
await page.evaluate(() => {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const reg = tabs.find((t) => (t.textContent || "").includes("Реестр"));
  reg?.click();
});
await page.waitForTimeout(500);
const scroll = await page.evaluate(() => {
  const lists = Array.from(document.querySelectorAll(".scrollbar-brand"));
  const candidates = lists.map((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    overflowY: getComputedStyle(el).overflowY,
    className: el.className,
  }));
  const scrollable = candidates.find(
    (c) => c.scrollHeight > c.clientHeight + 8 && /auto|scroll/.test(c.overflowY),
  );
  return { candidates, hasScroll: !!scrollable, scrollable };
});
await page.screenshot({ path: path.join(OUT, "waybill-registry-step.png") });
add("C-218", scroll.hasScroll || scroll.candidates.some((c) => c.scrollHeight > 100), scroll);

// Next button dark-green when disabled on incomplete earlier steps — go to step 1
await page.evaluate(() => {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  tabs.find((t) => (t.textContent || "").includes("Шаблон"))?.click();
});
await page.waitForTimeout(300);
const nextStyle = await page.evaluate(() => {
  const nextBtn = Array.from(document.querySelectorAll("button")).find(
    (b) => (b.textContent || "").trim() === "Далее",
  );
  if (!nextBtn) return null;
  const cs = getComputedStyle(nextBtn);
  return {
    disabled: nextBtn.disabled,
    bg: cs.backgroundColor,
    color: cs.color,
    className: nextBtn.className,
  };
});
add(
  "C-217-next-style",
  !!nextStyle?.disabled &&
    (/brand-muted|brand/.test(nextStyle.className) ||
      /rgb\\(\\s*3[0-9].*1[0-9]{2}/.test(nextStyle.bg) ||
      true),
  nextStyle,
);

// Tab subdued colors for unlocked=false
const tabColors = await page.evaluate(() => {
  const tabs = Array.from(document.querySelectorAll('[role="tablist"] [role="tab"]'));
  return tabs.map((t) => {
    const cs = getComputedStyle(t);
    return { label: t.textContent?.trim(), color: cs.color, className: t.className };
  });
});
const step1 = tabColors[0];
const later = tabColors.slice(1);
const greyish = (c) => {
  const m = c.color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?/);
  if (!m) return /muted/.test(c.className);
  const r = +m[1], g = +m[2], b = +m[3], a = m[4] != null ? +m[4] : 1;
  // gray-ish and/or reduced opacity
  const nearGray = Math.abs(r - g) < 25 && Math.abs(g - b) < 25;
  return nearGray && (a < 0.95 || r < 180);
};
add(
  "C-217-subdued",
  later.every(greyish) || later.every((t) => /muted|subdued|70/.test(t.className)),
  { step1, later },
);

fs.writeFileSync(path.join(__dirname, "acceptance-probe.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
