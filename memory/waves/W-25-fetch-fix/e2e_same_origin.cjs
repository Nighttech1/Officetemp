async (page) => {
  const outDir = "E:/Applications/OfficeTemp/memory/waves/W-25-fetch-fix";
  const tpl =
    "E:/Applications/OfficeTemp/memory/waves/W-22-user-google-connect/user_template.docx";
  const googleUrl =
    "https://docs.google.com/spreadsheets/d/1cucynWgxo3korll0CyESQSSVQXtCCom4XhA8ZmPRMqU/edit?usp=sharing";
  const dest = outDir + "/client-downloaded.docx";

  const failed = [];
  const apiCalls = [];
  page.on("requestfailed", (req) => {
    failed.push({ url: req.url(), err: req.failure()?.errorText });
  });
  page.on("response", (res) => {
    const u = res.url();
    if (u.includes("/api/v1/") || u.includes("/generate/")) {
      apiCalls.push({ url: u, status: res.status() });
    }
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:3010/app/documents/waybills", {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForTimeout(4000);

  const baseProbe = await page.evaluate(async () => {
    // What does the bundled client use? Probe relative vs absolute.
    const out = { origin: location.origin };
    try {
      const r = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin1", password: "admin1" }),
      });
      out.sameOriginLogin = r.status;
    } catch (e) {
      out.sameOriginLoginErr = String(e);
    }
    try {
      const r = await fetch("http://127.0.0.1:8001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin1", password: "admin1" }),
      });
      out.direct8001Login = r.status;
    } catch (e) {
      out.direct8001LoginErr = String(e);
    }
    return out;
  });

  const docBtn = page.getByText("Накладная №001").first();
  if ((await docBtn.count()) > 0) await docBtn.click();
  await page.waitForTimeout(400);

  await page.getByRole("button", { name: /1\.\s*Шаблон/ }).click();
  await page.waitForTimeout(300);
  await page.locator('input[type="file"]').first().setInputFiles(tpl);
  await page.waitForTimeout(4000);

  await page.getByRole("button", { name: /^Далее$/ }).click();
  await page.waitForTimeout(700);

  const inputs = page.locator("input");
  const count = await inputs.count();
  let filled = false;
  for (let i = 0; i < count; i++) {
    const el = inputs.nth(i);
    const type = (await el.getAttribute("type")) || "text";
    if (type === "file" || type === "number" || type === "checkbox") continue;
    const ph = (await el.getAttribute("placeholder")) || "";
    const val = await el.inputValue().catch(() => "");
    if (
      /google|http|sheets|ссыл/i.test(ph) ||
      /docs\.google|spreadsheets/i.test(val) ||
      type === "url"
    ) {
      await el.fill(googleUrl);
      filled = true;
      break;
    }
  }
  if (!filled) {
    await page
      .locator('input[type="url"], input[type="text"], input:not([type])')
      .last()
      .fill(googleUrl);
  }
  await page.getByRole("button", { name: /Подключить/ }).click();
  await page.waitForTimeout(14000);

  const next = page.getByRole("button", { name: /^Далее$/ });
  if (await next.isEnabled().catch(() => false)) await next.click();
  else await page.getByRole("button", { name: /3\.\s*Стыковки/ }).click();
  await page.waitForTimeout(900);

  const selects = page.locator("select");
  const sc = await selects.count();
  for (let i = 0; i < sc; i++) {
    const s = selects.nth(i);
    const options = s.locator("option");
    const oc = await options.count();
    for (let j = 1; j < oc; j++) {
      const v = await options.nth(j).getAttribute("value");
      if (v) {
        await s.selectOption(v);
        break;
      }
    }
  }

  if (await next.isEnabled().catch(() => false)) await next.click();
  else await page.getByRole("button", { name: /4\.\s*Генерация/ }).click();
  await page.waitForTimeout(1000);

  const respPromise = page.waitForResponse(
    (r) => r.url().includes("/generate/docx"),
    { timeout: 90000 },
  );
  const downloadPromise = page
    .waitForEvent("download", { timeout: 90000 })
    .catch((e) => ({ error: String(e) }));

  await page.getByRole("button", { name: /Скачать DOCX/i }).first().click();
  let genUrl = null;
  let genStatus = null;
  try {
    const resp = await respPromise;
    genUrl = resp.url();
    genStatus = resp.status();
  } catch (e) {
    genUrl = String(e);
  }

  const dl = await downloadPromise;
  let saveErr = null;
  if (dl && !dl.error && typeof dl.saveAs === "function") {
    try {
      await dl.saveAs(dest);
    } catch (e) {
      saveErr = String(e);
    }
  } else {
    saveErr = (dl && dl.error) || "no download";
  }

  await page.waitForTimeout(1500);
  const body = await page.locator("body").innerText();
  await page.screenshot({ path: outDir + "/step4-after.png" });

  const usedSameOrigin =
    typeof genUrl === "string" &&
    genUrl.includes("127.0.0.1:3010") &&
    !genUrl.includes(":8001");

  return {
    baseProbe,
    genUrl,
    genStatus,
    usedSameOrigin,
    saveErr,
    dest,
    failed,
    apiCalls: apiCalls.slice(-15),
    uiOk: /Готово:|скачан/i.test(body),
    uiErr: body.match(/Нет связи|Failed to fetch/i)?.[0] || null,
  };
}
