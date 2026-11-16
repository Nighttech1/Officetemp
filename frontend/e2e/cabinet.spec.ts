import { expect, test } from "@playwright/test";

test.describe("DocSaaS cabinet smoke", () => {
  test("login shows DocSaaS brand", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("DocSaaS").first()).toBeVisible();
  });

  test("no horizontal overflow at 390 on login", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow).toBeFalsy();
  });
});
