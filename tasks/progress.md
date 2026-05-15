# PakProp AI Web — Build Progress

**Last updated:** 2026-05-15 (Phase 11 — 27-gap audit closure complete; all gaps resolved)
**Current phase:** Phase 11 complete — all frontend/backend gaps closed; ready for deployment
**Frontend completion score:** 100% pre-launch features (production deployment remaining)

---

## Completed ✅

### Foundation

| Feature | File(s) |
|---------|---------|
| Next.js 15 scaffold (TypeScript, Tailwind, App Router) | `package.json`, `src/` |
| API client with JWT auto-refresh interceptor | `src/lib/api.ts` |
| Zustand auth store (persist to localStorage + cookies) | `src/store/auth.ts` |
| Role-based middleware (admin/agent/developer/public routes) | `src/middleware.ts` |
| Login page — OTP flow (send → verify → JWT → role redirect) | `src/app/login/page.tsx` |
| Client role (`role=user`) blocked at login — WhatsApp redirect shown | `src/app/login/page.tsx` |
| Payment return page added to PUBLIC_PATHS (no session needed) | `src/middleware.ts` |
| `.env.local` with backend URL | `.env.local` |
| Input visibility fixed globally (dark mode removed) | `src/globals.css` |

### Shared Components

| Component | File(s) |
|-----------|---------|
| `Sidebar` — role-aware nav, logout, role badge | `src/components/layout/Sidebar.tsx` |
| `DashboardLayout` — sidebar + top header bar | `src/components/layout/DashboardLayout.tsx` |
| `NotificationBell` — bell icon, unread badge, dropdown inbox, mark-all-read, 30s poll | `src/components/ui/NotificationBell.tsx` |
| `StatsCard`, `Badge`, `LoadingSpinner`, `Pagination` | `src/components/ui/` |
| `UserManagementPage` — shared role-parameterised admin user table | `src/components/admin/UserManagementPage.tsx` |
| `NotificationsInbox` — full notification list, pagination, mark single/all read, 30s poll | `src/components/notifications/NotificationsInbox.tsx` |

### API Client (`src/lib/api.ts`) — 40+ named functions

All calls use named wrapper functions. No raw `api.get/post` in pages.

| Group | Functions |
|-------|-----------|
| Auth | `sendOtp`, `verifyOtp`, `getMe`, `logout` |
| Users | `getUsers`, `getUser`, `searchUsers`, `createUser`, `updateUser`, `deleteUser` |
| Leads | `getLeads`, `getLead`, `updateLead`, `suggestAgentsForLead`, `assignAgentToLead`, `autoAssignLead`, `getLeadConversations`, `sendLeadMessage`, `getDuplicateLeads` |
| Appointments | `getAppointments`, `getAppointment`, `createAppointment`, `updateAppointment`, `confirmAppointment`, `rescheduleAppointment`, `cancelAppointment`, `completeAppointment` |
| Properties | `getProperties`, `getMyProperties`, `getProperty`, `createProperty`, `updateProperty`, `deleteProperty`, `requestVerification`, `rescoreProperty`, `rescoreAllProperties`, `uploadPropertyImages`, `deletePropertyImage` |
| Agents | `getAgentProfile`, `updateAgentProfile`, `updateAgentAvailability`, `getAvailableAgents`, `getAgentsList`, `createAgent`, `updateAgent`, `deleteAgent`, `getPendingAgents`, `registerAgent`, `approveAgent`, `rejectAgent` |
| Team | `getTeam`, `addTeamMember`, `removeTeamMember` |
| Deal Locks | `getDealLocks`, `getMyDealLocks`, `getDealLock`, `initiateDealLock`, `confirmDealLock`, `cancelDealLock` |
| Payments | `createCheckout`, `getPayments` |
| Verification | `getVerificationQueue`, `reviewVerification`, `getDocumentScans`, `getDocumentScan`, `linkDocumentToVerification`, `runFraudCheck` |
| Fraud | `getFraudStats`, `getFraudAlerts`, `getFlaggedUsers`, `getBlacklist`, `addBlacklistToken`, `removeBlacklistToken` |
| Reports | `generateReport`, `getReport`, `downloadReport`, `getMyReports`, `getLeadReport`, `getAgentReport`, `getPropertyReport`, `getRevenueReport`, `getBotReport`, `getAgentPersonalReport` |
| Notifications | `getNotifications`, `markNotificationsRead` |
| Audit | `getAudits`, `downloadAudit` |
| Config | `getConfig`, `updateConfig` |

### Types (`src/types/index.ts`) — fully aligned with backend serializers

| Type | Notes |
|------|-------|
| `User`, `Role` | UUID id, nullable name, `ntn`/`cnic`/`is_filer` |
| `Property` | Includes `primary_image`, `images: PropertyImage[]`, `installment_available` |
| `PropertyImage` | UUID id, image URL, caption, order |
| `Lead` | `intent_score` (alias of `score`), correct nullable fields |
| `ConversationMessage` | `sender_phone`, `sender_name` (matches serializer output) |
| `Appointment` + `AppointmentStatus` | All fields including `reminder_sent_at`, `created_by` |
| `DealLock` + `DealLockStatus` | Full escrow model shape |
| `Agent`, `AgentProfile` | Full profile with stats, `registration_status`, `rejection_reason` |
| `DocumentScan`, `VerificationRequest` | UUID id, `signal_score`, `fraud_flags` |
| `Report` + `ReportType` + `ReportStatus` | Async report lifecycle |
| `Notification` | `title`, `is_read`, full status enum |
| `Payment`, `SystemConfig`, `AuditReport`, `StatsOverview`, `ApiError` | Complete |

---

### Admin Dashboard

| Page | Route | Features |
|------|-------|---------|
| Overview | `/admin` | 12 stat cards (properties / leads+agents / deal locks), 4 parallel queries |
| System Setup | `/admin/setup` | WhatsApp API, AI Backend, Payment Gateway, Feature Toggles — all live; sensitive key masking; first-run banner |
| Clients | `/admin/clients` | CRUD via `UserManagementPage` (add/edit/deactivate/delete/details) |
| Agents | `/admin/agents` | Full CRUD: add agent (5 sections), edit, verify/activate toggles, copy Agent ID, details modal, **paginated**, **Pending Approval tab** with approve/reject modal |
| Developers | `/admin/developers` | CRUD via `UserManagementPage` |
| Admins | `/admin/admins` | CRUD via `UserManagementPage` |
| Properties | `/admin/properties` | Add/Edit/Delete/Verify/Rescore + image upload section in detail modal |
| Leads | `/admin/leads` | Full table: search + status filter, auto-assign, CRM chat panel (send WhatsApp), **paginated** |
| Appointments | `/admin/appointments` | Table with confirm/cancel/complete actions, status filter, **+ Book Appointment modal** (LeadPicker, property, agent, datetime, duration, notes) |
| Verification | `/admin/verification` | Signal score bar, doc scans modal, Approve/Reject/Dispute with notes |
| Deal Locks + Payments | `/admin/deals` | Two-tab page: deal locks (confirm/cancel/timer) + payments table |
| Fraud Monitor | `/admin/fraud` | 8 stat cards, severity-coded alert feed, flagged users, blacklist CRUD |
| Reports | `/admin/reports` | Lead funnel + property inventory with **weekly/monthly bar charts** (period toggle), agent performance table |
| Audit Log | `/admin/audit` | Table of all AI property audits — risk score, investment grade, liquidity bar, PDF download |
| Notifications | `/admin/notifications` | Full notification inbox — paginated list, unread badges, mark single/all read, channel + status labels, 30s auto-refresh |

### Agent Dashboard

| Page | Route | Features |
|------|-------|---------|
| Overview | `/agent` | Profile stats, lead counts, recent leads |
| My Leads | `/agent/leads` | Intent score bars, all columns, **CRM chat panel** (full thread + send WhatsApp) |
| Appointments | `/agent/appointments` | Upcoming/past split, confirm + mark-complete actions, **+ Book Appointment modal** (LeadPicker, property, datetime, duration; agent auto-filled from profile) |
| Duplicate Leads | `/admin/leads/duplicates` | Groups of leads sharing same normalized phone — amber highlight, raw phone + status + intent + date |
| My Listings | `/agent/listings` | Card grid, filter tabs, verification request, **photo upload per card**, primary image thumbnail |
| My Profile | `/agent/profile` | Full edit: name, email, company, designation, experience, bio, **cities, areas, specializations**, **availability toggle (available/busy/offline)** |
| Lead Detail | `/agent/leads/[id]` | Lead info panel, status buttons, notes editor, appointment list + book modal, full conversation thread + send |
| Notifications | `/agent/notifications` | Full notification inbox via shared `NotificationsInbox` component |

### Developer Dashboard

| Page | Route | Features |
|------|-------|---------|
| Overview | `/developer` | Summary stats |
| Inventory | `/developer/inventory` | Properties filterable by type |
| Lead Analytics | `/developer/leads` | Hot/warm/cold breakdown, full leads table |
| My Team | `/developer/team` | **Active + Pending tabs**, approve/reject with rejection modal, add-agent dropdown, remove member |
| Reports | `/developer/reports` | Report generator (4 types + input params) + history table with PDF download + **weekly/monthly trend charts** |
| Notifications | `/developer/notifications` | Full notification inbox via shared `NotificationsInbox` component |

### Analytics Dashboards (Phase 6)

| Page | Route | Features |
|------|-------|---------|
| Admin Analytics | `/admin/analytics` | 6 KPI cards, lead pipeline funnel, property breakdown (type/legal/city), 4 trend charts (leads/properties/deals/bot) with period toggles, agent performance table |
| Agent Analytics | `/agent/analytics` | 6 KPI cards (total/hot/closed leads, listings, deals, conversion %), lead pipeline funnel, source breakdown, lead trend chart |
| Developer Analytics | `/developer/analytics` | 5 KPI cards, org lead pipeline funnel, property breakdown (type/legal/city), 2 trend charts (leads/properties), team performance table |

### Shared Charts Components (`src/components/ui/Charts.tsx`)

| Component | Description |
|-----------|-------------|
| `BarChart` | CSS bar chart, 5 colors (blue/emerald/violet/amber/rose), configurable height, period labels |
| `MiniBarChart` | Compact sparkline, no labels |
| `StatCard` | KPI card with colored left-border accent + optional icon + sub-text |
| `PeriodToggle` | Weekly/monthly toggle button group |
| `ChartCard` | Card wrapper with title + optional period toggle |
| `LeadPipelineFunnel` | Horizontal funnel bars with stage conversion rates shown between each step |
| `BreakdownBar` | Segmented horizontal bar with color legend below |
| `SectionHeader` | Section title + subtitle |
| `formatPkr()` | PKR number → human-readable (Cr/L/K) |
| `formatPeriodLabel()` | ISO date → "Jan 25" / "May 14" per period type |

### Agent Registration (Phase 6)

| Page | Route | Features |
|------|-------|---------|
| Agent Register | `/register` | 5-section public form: Account Details, Agent Type, Professional Details, Geographic Coverage, Specializations; developer employee path shows org selector; success confirmation state |

### Other Pages

| Page | Route | Notes |
|------|-------|-------|
| Login | `/login` | OTP flow, client role blocked |
| Payment Return | `/payments/return` | Success/cancelled/unknown states, auto-redirect countdown |

---

## Navigation (Sidebar)

| Role | Nav Items |
|------|-----------|
| Admin | Overview, **Analytics**, System Setup, Clients, Leads, Duplicates, Appointments, Agents, Developers, Admins, Properties, Verification, Deal Locks, Fraud Monitor, Reports, Audit Log |
| Agent | Overview, **Analytics**, My Leads, Appointments, My Listings, My Profile |
| Developer | Overview, **Analytics**, Inventory, Lead Analytics, My Team, Reports |

---

## Phase 8 — Complete ✅

All Phase 8 items are done:
- `/admin/notifications`, `/agent/notifications`, `/developer/notifications` — full inbox via shared `NotificationsInbox` component with pagination + mark-read
- `/admin/audit` — was already built in a previous phase (AI property audit table)
- Sidebar updated: Notifications link added for all three roles

## Phase 10 — Complete ✅ (All Pre-Launch Missing Features)

### New API functions added to `api.ts`
- `getNotificationPreferences()`, `updateNotificationPreferences()` → `GET/PATCH /auth/me/notification-preferences/`
- `compareProperties(ids)` → `GET /properties/compare/?ids=...`
- `getMarketTrends(params)` → `GET /properties/market-trends/`
- `bulkAssignLeads(lead_ids, agent_id)` → `POST /leads/bulk-assign/`
- `bulkRejectVerifications(verification_ids, notes)` → `POST /verification/bulk-reject/`

### New types added to `types/index.ts`
- `UserNotificationPreference`, `MarketTrend`, `LeadScoreHistory`

### New components
- `src/components/notifications/NotificationPreferencesPanel.tsx` — per-channel + per-event toggle panel (get/patch prefs with optimistic UI via TanStack Query)

### New pages
| Page | Route | Features |
|------|-------|---------|
| Property Compare | `/admin/properties/compare` | Select up to 4 properties from searchable list, side-by-side table with Badge-coded legal/risk status |
| Market Trends | `/admin/market-trends` | City + period filters, CSS bar charts for avg price + listing volume, data table |
| Admin Settings | `/admin/settings` | Notification preferences panel |
| Developer Settings | `/developer/settings` | Notification preferences panel |

### Sidebar updates
- Admin: Added "Compare" (→ `/admin/properties/compare`), "Market Trends" (→ `/admin/market-trends`), "Settings" (→ `/admin/settings`)
- Developer: Added "Settings" (→ `/developer/settings`)

### Agent profile update
- `/agent/profile` — `NotificationPreferencesPanel` section appended below profile card

## Phase 11 — 27-Gap Audit Closure (2026-05-15)

Full cross-repo audit identified and closed 27 gaps (original 19-gap plan + 8 additional gaps found via audit).

### New API functions added to `api.ts`

| Function | Endpoint |
|----------|----------|
| `sellerConfirmDealLock(id)` | `PATCH /deals/lock/{id}/seller-confirm/` |
| `releaseDealLock(id, notes?)` | `PATCH /deals/lock/{id}/release/` |
| `disputeDealLock(id, notes?)` | `PATCH /deals/lock/{id}/dispute/` |

### Updated types in `types/index.ts`

| Type | Change |
|------|--------|
| `Lead` | Added `source: "whatsapp" \| "web" \| "manual" \| null` and `intent_signals: Record<string, unknown> \| null` |
| `Property` | Added `ai_analysis: Record<string, unknown> \| null` |

### Admin Deals page (`/admin/deals`)

| Feature | Notes |
|---------|-------|
| "Released" and "Disputed" filter tabs added | Shows deals in those final states |
| **Release** button (indigo) — shown on `status === "locked"` | Calls `releaseDealLock()`, invalidates query |
| **Dispute** button (red outline) — shown on `locked` or `initiated` | Calls `disputeDealLock()`, invalidates query |
| `sellerConfirmDealLock` wired — "Seller Confirm" button for locked + `seller_confirmed === false` | — |

### Lead source badge (admin/leads, agent/leads, lead detail)

| Location | Feature |
|----------|---------|
| `admin/leads` contact cell | Source badge: green=WhatsApp, blue=web, gray=manual |
| `agent/leads` contact cell | Same source badge pattern |
| `agent/leads/[id]` sidebar | "Source" row with colored badge |
| `agent/leads/[id]` sidebar | "AI Scoring Signals" section — expandable key/value list from `intent_signals` |

### Property AI Analysis (`/admin/properties`)

| Feature | Notes |
|---------|-------|
| `AiAnalysisSection` collapsible component | Toggles Gemini JSON payload in property detail modal |
| Shown only when `ai_analysis` is non-empty | Key/value pairs rendered in a blue tinted card |

**Phase 11 completion: 100%** ✅ — All 27 gaps closed. TypeScript clean (`npx tsc --noEmit` = 0 errors).

---

## Phase 9 — Remaining Work

### Medium priority

| Item | Est | Notes |
|------|-----|-------|
| Production CORS + CSP hardening | 1h | Restrict origins to production domain only |
| Deployment to Render | 2h | `NEXT_PUBLIC_API_URL` → Render backend URL |

### Low priority / post-launch

| Item | Notes |
|------|-------|
| Real-time fraud alert feed | Currently loads on page visit; add polling interval or WebSocket |
| Cookie-only token storage | Tokens in both localStorage + cookies; consolidate to httpOnly cookies for production security |
| Offline / error boundary UI | Graceful fallback if backend unreachable |

---

## Known Gaps

| Item | Priority | Notes |
|------|----------|-------|
| Token 401 refresh already redirects to login | — | `api.ts` interceptor catches refresh failure and does `window.location.href = "/login"` ✓ |
| Notification delivery requires WhatsApp 24h window | — | Dashboard bell shows unread correctly; WhatsApp message may fail silently for inactive clients |
| Production deployment not done | High | CORS, CSP, Render deploy, env vars still to configure |

---

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1   # dev
# NEXT_PUBLIC_API_URL=https://yourapp.onrender.com/api/v1  # production
```

---

## Running Locally

```bash
cd pakpropaiweb
npm install
npm run dev       # http://localhost:3000
```

Backend must be running at port 8000.
