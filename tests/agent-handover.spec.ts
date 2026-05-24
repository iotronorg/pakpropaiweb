import { test, expect, type Page } from "@playwright/test";

const LEAD_ID      = "aaaabbbb-1111-2222-3333-444455556666";
const SESSION_ID   = "ccccdddd-5555-6666-7777-888899990000";
const ORG_ID       = "11112222-3333-4444-5555-666677778888";
const AGENT_ID     = "test-agent-uid";
const LEAD_URL     = `/agent/leads/${LEAD_ID}`;
const LIVE_CHAT_URL = `/agent/leads/${LEAD_ID}/live-chat`;

function makeLead(overrides: Record<string, unknown> = {}) {
  return {
    id:                  LEAD_ID,
    phone:               "+15550001234",
    name:                "Ali Khan",
    intent:              "buy",
    intent_score:        72,
    location_interest:   "Lahore",
    budget_min:          1_000_000,
    budget_max:          3_000_000,
    budget_currency:     "PKR",
    status:              "warm",
    priority:            "high",
    routing_state:       "ai_handling",
    notes:               "",
    source:              "whatsapp",
    intent_signals:      null,
    score_factors:       null,
    organization:        ORG_ID,
    assigned_agent_id:   null,
    assigned_agent_name: null,
    last_contacted_at:   null,
    created_at:          "2026-05-01T10:00:00Z",
    wa_session_id:       SESSION_ID,
    ...overrides,
  };
}

async function seedAuth(page: Page) {
  await page.addInitScript((agentId: string) => {
    const state = {
      state: {
        user: {
          id:           agentId,
          phone:        "+15550009999",
          name:         "Agent Smith",
          email:        "agent@test.com",
          role:         "agent",
          is_active:    true,
          is_phone_verified: true,
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
  }, AGENT_ID);
}

async function mockLeadApi(page: Page, lead = makeLead()) {
  await page.route(`**/api/v1/leads/${LEAD_ID}/`, (route) => {
    route.fulfill({ json: lead, status: 200 });
  });
  // Stub out secondary calls the lead detail page makes
  await page.route(`**/api/v1/leads/${LEAD_ID}/conversations/`, (route) =>
    route.fulfill({ json: [], status: 200 }),
  );
  await page.route(`**/api/v1/appointments/**`, (route) =>
    route.fulfill({ json: { count: 0, results: [] }, status: 200 }),
  );
  await page.route(`**/api/v1/agents/me/`, (route) =>
    route.fulfill({ json: { id: 1, name: "Agent Smith" }, status: 200 }),
  );
  await page.route(`**/api/v1/leads/${LEAD_ID}/activities/`, (route) =>
    route.fulfill({ json: [], status: 200 }),
  );
  await page.route(`**/api/v1/leads/${LEAD_ID}/score-history/`, (route) =>
    route.fulfill({ json: [], status: 200 }),
  );
}

// ── Test 1: Live Chat button appears on lead detail when wa_session_id present ──

test("Live Chat button links to live-chat page when lead has wa_session_id", async ({ page }) => {
  await seedAuth(page);
  await mockLeadApi(page);

  await page.goto(LEAD_URL);
  const btn = page.getByRole("button", { name: "Live Chat" });
  await expect(btn).toBeVisible({ timeout: 8_000 });
});

// ── Test 2: Live Chat button hidden when lead has no wa_session_id ─────────────

test("Live Chat button is hidden when lead has no wa_session_id", async ({ page }) => {
  await seedAuth(page);
  await mockLeadApi(page, makeLead({ wa_session_id: null }));

  await page.goto(LEAD_URL);
  // Wait for lead name to confirm page loaded
  await expect(page.getByRole("heading", { name: "Ali Khan" })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("button", { name: "Live Chat" })).not.toBeVisible();
});

// ── Test 3: Live-chat page renders TakeControlBar in AI_MANAGED state ──────────

test("live-chat page renders AI-managed state with Take Control button", async ({ page }) => {
  await seedAuth(page);

  // Mock the lead API
  await page.route(`**/api/v1/leads/${LEAD_ID}/`, (route) => {
    route.fulfill({ json: makeLead(), status: 200 });
  });

  // The page will attempt a WebSocket connection which will fail in test — that's fine;
  // we verify the UI renders with AI_MANAGED state (default before any WS event)
  await page.goto(LIVE_CHAT_URL);

  // Header with lead name
  await expect(page.getByText("Ali Khan")).toBeVisible({ timeout: 8_000 });

  // TakeControlBar shows the amber AI-managed banner
  await expect(page.getByText("AI is handling this conversation")).toBeVisible();
  await expect(page.getByRole("button", { name: "TAKE CONTROL" })).toBeVisible();
});
