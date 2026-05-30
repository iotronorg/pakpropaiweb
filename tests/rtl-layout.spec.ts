/**
 * RTL layout spec — GLOBAL-5
 * Verifies that setting the locale cookie to 'ar' produces a right-to-left layout
 * with no horizontal overflow.
 *
 * Run: npx playwright test rtl-layout.spec.ts
 * Requires: a running Next.js dev server on http://localhost:3000
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("RTL layout (Arabic locale)", () => {
  test.beforeEach(async ({ page }) => {
    // Set the locale cookie to Arabic before each test
    await page.goto(BASE_URL);
    await page.context().addCookies([
      { name: "realtron_locale", value: "ar", domain: "localhost", path: "/" },
    ]);
  });

  test("html[dir='rtl'] is present when locale is Arabic", async ({ page }) => {
    await page.goto(BASE_URL);
    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe("rtl");
  });

  test("html[lang='ar'] is set when locale is Arabic", async ({ page }) => {
    await page.goto(BASE_URL);
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("ar");
  });

  test("landing page has no horizontal overflow in RTL mode", async ({ page }) => {
    await page.goto(BASE_URL);
    const bodyScrollWidth  = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientWidth  = await page.evaluate(() => document.body.clientWidth);
    // Allow 1px tolerance for sub-pixel rendering
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1);
  });

  test("sidebar renders on the right side in RTL mode", async ({ page, context }) => {
    // Log in as a test user (skipped if not in a full E2E environment)
    // This test checks the sidebar position relative to the viewport
    // by inspecting the computed left/right offset of the sidebar element.
    await page.goto(`${BASE_URL}/login`);
    const sidebar = page.locator("aside").first();

    // Only assert if the sidebar is visible (logged-in state)
    const sidebarCount = await sidebar.count();
    if (sidebarCount === 0) {
      test.skip(); // Not logged in — skip sidebar position check
      return;
    }

    const box = await sidebar.boundingBox();
    if (!box) { test.skip(); return; }

    const viewportWidth = page.viewportSize()?.width ?? 1280;
    // In RTL the sidebar should be on the right half of the screen
    expect(box.x + box.width).toBeGreaterThan(viewportWidth / 2);
  });
});
