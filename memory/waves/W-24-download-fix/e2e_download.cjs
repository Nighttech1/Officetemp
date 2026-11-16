async (page) => {
  const outDir = "E:/Applications/OfficeTemp/memory/waves/W-24-download-fix";
  const tpl =
    "E:/Applications/OfficeTemp/memory/waves/W-22-user-google-connect/user_template.docx";
  const googleUrl =
    "https://docs.google.com/spreadsheets/d/1cucynWgxo3korll0CyESQSSVQXtCCom4XhA8ZmPRMqU/edit?usp=sharing";
  const dest = outDir + "/client-downloaded.docx";

  const failed = [];
  page.on("requestfailed", (req) => {
    failed.push({ url: req.url(), err: req.failure()?.errorText });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:3010/app/documents/waybills", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(3000);

  const tokenState = await page.evaluate(() => ({
    hasToken: !!localStorage.getItem("docsaas_access_token"),
  }));

  const body0 = await page.locator("body").innerText();
  const authErr0 = /Нет входа в API|Failed to fetch/i.test(body0);

  const docBtn = page.getByText("Накладная №001").first();
  if ((await docBtn.count()) > 0) await docBtn.click();
  await page.waitForTimeout(400);

  await page.getByRole("button", { name: /1\.\s*Шаблон/ }).click();
  await page.waitForTimeout(300);
  await page.locator('input[type="file"]').first().setInputFiles(tpl);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: outDir + "/step1-template.png" });
  let body = await page.locator("body").innerText();
  const step1ok = /user_template|Шаблон сохран|сохранён|тег|NN|date/i.test(body);

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
  await page.screenshot({ path: outDir + "/step2-data.png" });
  body = await page.locator("body").innerText();
  const step2ok =
    /лист|строк|колонк|Мастерская|График|загруж/i.test(body) &&
    !/Failed to fetch|Нет входа в API/i.test(body);
  const step2err =
    body.match(
      /Google не отдал|Failed to fetch|Нет связи|Нет входа|ошибк[аи].{0,120}/i,
    )?.[0] || null;

  const next = page.getByRole("button", { name: /^Далее$/ });
  const nextEnabled = await next.isEnabled().catch(() => false);
  if (nextEnabled) await next.click();
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
  await page.screenshot({ path: outDir + "/step3-mapping.png" });

  if (await next.isEnabled().catch(() => false)) await next.click();
  else await page.getByRole("button", { name: /4\.\s*Генерация/ }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: outDir + "/step4-before-download.png" });

  const previewSnippet = await page.evaluate(() => {
    const asides = Array.from(
      document.querySelectorAll("aside, [class*='preview'], [class*='Preview']"),
    );
    return (
      asides.map((a) => a.textContent || "").join("\n") || document.body.innerText
    ).slice(0, 1500);
  });

  const respPromise = page.waitForResponse(
    (r) => r.url().includes("/api/v1/generate/"),
    { timeout: 90000 },
  );
  const downloadPromise = page
    .waitForEvent("download", { timeout: 90000 })
    .catch((e) => ({ error: String(e) }));

  await page
    .getByRole("button", { name: /Скачать DOCX|DOCX|Скачать/i })
    .first()
    .click();

  let genMeta = null;
  try {
    const resp = await respPromise;
    const buf = Buffer.from(await resp.body());
    genMeta = {
      url: resp.url(),
      status: resp.status(),
      size: buf.length,
      isZip: buf.length > 2 && buf[0] === 0x50 && buf[1] === 0x4b,
      detail:
        resp.status() >= 400
          ? buf.toString("utf8").slice(0, 400)
          : null,
    };
  } catch (e) {
    genMeta = { error: String(e) };
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
    saveErr = (dl && dl.error) || "no download event";
  }

  await page.waitForTimeout(2000);
  body = await page.locator("body").innerText();
  const uiErr =
    body.match(
      /Failed to fetch|Нет связи с API|Нет входа|Генерация не|ошибк[аи].{0,160}/i,
    )?.[0] || null;

  await page.screenshot({ path: outDir + "/step4-after-download.png" });

  return {
    tokenState,
    authErr0,
    step1ok,
    step2ok,
    step2err,
    nextEnabled,
    selectsMapped: sc,
    genMeta,
    saveErr,
    dest,
    uiErr,
    failed: failed.slice(0, 20),
    hasOkMessage: /Готово:|скачан/i.test(body),
    previewSnippet,
    bodyTail: body.slice(-1500),
  };
}
