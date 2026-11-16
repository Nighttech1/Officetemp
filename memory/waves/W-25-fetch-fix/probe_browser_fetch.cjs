async (page) => {
  const outDir = "E:/Applications/OfficeTemp/memory/waves/W-25-fetch-fix";
  const failed = [];
  const reqs = [];
  page.on("requestfailed", (req) => {
    failed.push({
      url: req.url(),
      err: req.failure()?.errorText,
      method: req.method(),
    });
  });
  page.on("response", async (res) => {
    if (res.url().includes("/api/v1/")) {
      reqs.push({ url: res.url(), status: res.status() });
    }
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:3010/app/documents/waybills", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2500);

  // Probe fetch from browser to generate endpoint (OPTIONS + small POST without file)
  const probe = await page.evaluate(async () => {
    const base = "http://127.0.0.1:8001";
    const out = {};
    try {
      const h = await fetch(base + "/health");
      out.health = h.status;
    } catch (e) {
      out.healthErr = String(e);
    }
    try {
      const login = await fetch(base + "/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin1", password: "admin1" }),
      });
      out.login = login.status;
      const j = await login.json();
      out.token = j.access_token ? "yes" : "no";
      // tiny multipart without real template — expect 400 but not Failed to fetch
      const fd = new FormData();
      fd.append(
        "template",
        new Blob(["not-a-docx"], { type: "application/octet-stream" }),
        "x.docx",
      );
      fd.append("context", JSON.stringify({ a: 1 }));
      const g = await fetch(base + "/api/v1/generate/docx", {
        method: "POST",
        headers: { Authorization: "Bearer " + j.access_token },
        body: fd,
      });
      out.genStatus = g.status;
      out.genText = (await g.text()).slice(0, 200);
    } catch (e) {
      out.genErr = String(e);
      out.genName = e && e.name;
      out.genMessage = e && e.message;
    }
    // Also try what the app thinks API base is by reading next public if injected
    out.origin = location.origin;
    out.tokenInLs = !!localStorage.getItem("docsaas_access_token");
    return out;
  });

  // If wizard already on step 4 with data, try click download
  let clickResult = null;
  const body = await page.locator("body").innerText();
  if (/Скачать DOCX/i.test(body)) {
    const respP = page
      .waitForResponse((r) => r.url().includes("/generate/"), { timeout: 60000 })
      .catch((e) => ({ error: String(e) }));
    await page.getByRole("button", { name: /Скачать DOCX/i }).first().click();
    const resp = await respP;
    await page.waitForTimeout(2000);
    const body2 = await page.locator("body").innerText();
    clickResult = {
      resp:
        resp && resp.status
          ? { status: resp.status(), url: resp.url() }
          : resp,
      uiErr: body2.match(/Нет связи|Failed to fetch|Готово:|скачан/i)?.[0] || null,
      failed,
    };
  }

  await page.screenshot({ path: outDir + "/probe.png" }).catch(() => {});

  return { probe, clickResult, failed, reqs: reqs.slice(-20) };
}
