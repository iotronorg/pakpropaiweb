import { test, expect, type Page } from "@playwright/test";

const DEAL_ID     = "550e8400-e29b-41d4-a716-446655440000";
const DEAL_URL    = `/payments/deal-lock/${DEAL_ID}`;
const API_GLOB    = `**/api/v1/deals/lock/${DEAL_ID}/`;
const BUYER_PHONE = "+923001234567";

async function seedAuth(page: Page) {
  await page.addInitScript((phone: string) => {
    const state = {
      state: {
        user: {
          id:           "test-uid",
          phone,
          name:         "Test Buyer",
          email:        "",
          role:         "client",
          is_active:    true,
          date_joined:  "2026-01-01T00:00:00Z",
          last_active:  null,
          ntn:          null,
          cnic:         null,
          is_filer:     false,
        },
        isAuthenticated: true,
      },
      version: 0,
    };
    localStorage.setItem("realtron-auth", JSON.stringify(state));
  }, BUYER_PHONE);
}

function initiatedDeal() {
  return {
    id:               DEAL_ID,
    property:         "prop-uuid",
    property_title:   "Sunset Heights Unit 4B",
    property_city:    "Lahore",
    buyer_phone:      BUYER_PHONE,
    seller_phone:     null,
    agent_name:       null,
    token_amount:     50_000,
    currency:         "PKR",
    status:           "initiated",
    payment_gateway:  "safepay",
    payment_ref:      "",
    initiated_via:    "dashboard",
    buyer_confirmed:  false,
    seller_confirmed: false,
    lock_started_at:  null,
    lock_expires_at:  null,
    hours_remaining:  null,
    admin_notes:      "",
    created_at:       "2026-05-20T10:00:00Z",
    updated_at:       "2026-05-20T10:00:00Z",
  };
}

function lockedDeal() {
  const expiresAt = new Date(Date.now() + 47 * 60 * 60 * 1000).toISOString();
  return {
    ...initiatedDeal(),
    status:           "locked",
    buyer_confirmed:  true,
    lock_started_at:  new Date().toISOString(),
    lock_expires_at:  expiresAt,
    hours_remaining:  47,
  };
}

// ── Test 1: INITIATED state ──────────────────────────────────────────────────

test("shows Awaiting Payment badge when deal is initiated", async ({ page }) => {
  await seedAuth(page);
  await page.route(API_GLOB, (route) =>
    route.fulfill({ json: initiatedDeal() })
  );

  await page.goto(DEAL_URL);

  await expect(page.getByText("Awaiting Payment")).toBeVisible();
  await expect(page.getByTestId("countdown")).not.toBeVisible();
  await expect(page.getByRole("button", { name: /Pay Token Amount/i })).toBeVisible();
});

// ── Test 2: LOCKED state ─────────────────────────────────────────────────────

test("shows Reserved badge and HH:MM:SS countdown when deal is locked", async ({ page }) => {
  await seedAuth(page);
  await page.route(API_GLOB, (route) =>
    route.fulfill({ json: lockedDeal() })
  );

  await page.goto(DEAL_URL);

  await expect(page.getByText("Reserved")).toBeVisible();
  const countdown = page.getByTestId("countdown");
  await expect(countdown).toBeVisible();
  const text = await countdown.textContent();
  expect(text).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  await expect(page.getByRole("button", { name: /Pay Token Amount/i })).not.toBeVisible();
});

// ── Test 3: AVAILABLE → LOCKED state transition ──────────────────────────────

test("badge updates from Awaiting Payment to Reserved after deal locks", async ({ page }) => {
  await seedAuth(page);
  let callCount = 0;

  await page.route(API_GLOB, (route) => {
    callCount++;
    route.fulfill({ json: callCount === 1 ? initiatedDeal() : lockedDeal() });
  });

  await page.goto(DEAL_URL);
  await expect(page.getByText("Awaiting Payment")).toBeVisible();

  // Simulate backend state change by reloading (second call returns locked)
  await page.reload();
  await expect(page.getByText("Reserved")).toBeVisible();
  await expect(page.getByTestId("countdown")).toBeVisible();
});

// ── Test 4: Payment button triggers checkout ─────────────────────────────────

test("clicking Pay Token Amount calls checkout API", async ({ page, context }) => {
  // Seed cookies so middleware allows the route AND component shows the pay button
  await context.addCookies([
    { name: "access_token", value: "test-token", domain: "localhost", path: "/" },
    { name: "user_role",    value: "client",     domain: "localhost", path: "/" },
  ]);
  await seedAuth(page);
  await page.route(API_GLOB, (route) =>
    route.fulfill({ json: initiatedDeal() })
  );

  let checkoutCalled = false;
  await page.route("**/api/v1/payments/checkout/**", (route) => {
    checkoutCalled = true;
    route.fulfill({
      json: { checkout_url: "https://sandbox.getsafepay.com/checkout?token=tok_test" },
    });
  });

  // Prevent the browser from actually navigating to the gateway
  await page.route("https://sandbox.getsafepay.com/**", (route) => route.abort());

  await page.goto(DEAL_URL);
  const payBtn = page.getByRole("button", { name: /Pay Token Amount/i });
  await expect(payBtn).toBeVisible();
  await payBtn.click();

  await page.waitForTimeout(800);
  expect(checkoutCalled).toBe(true);
});
