# PakProp AI Web — Build Progress

**Last updated:** 2026-05-09 (session 24 — analytics charts + audit log page)
**Current phase:** Phase 6 in progress (analytics charts done; deployment prep remains)
**Frontend completion score:** 83% (analytics charts, audit log, and sidebar nav complete; deployment + pagination remain)

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

### API Client (`src/lib/api.ts`) — 40+ named functions

All calls use named wrapper functions. No raw `api.get/post` in pages.

| Group | Functions |
|-------|-----------|
| Auth | `sendOtp`, `verifyOtp`, `getMe`, `logout` |
| Users | `getUsers`, `getUser`, `searchUsers`, `createUser`, `updateUser`, `deleteUser` |
| Leads | `getLeads`, `getLead`, `updateLead`, `suggestAgentsForLead`, `assignAgentToLead`, `autoAssignLead`, `getLeadConversations`, `sendLeadMessage` |
| Appointments | `getAppointments`, `getAppointment`, `createAppointment`, `updateAppointment`, `confirmAppointment`, `rescheduleAppointment`, `cancelAppointment`, `completeAppointment` |
| Properties | `getProperties`, `getMyProperties`, `getProperty`, `createProperty`, `updateProperty`, `deleteProperty`, `requestVerification`, `rescoreProperty`, `rescoreAllProperties`, `uploadPropertyImages`, `deletePropertyImage` |
| Agents | `getAgentProfile`, `updateAgentProfile`, `getAgentsList`, `createAgent`, `updateAgent`, `deleteAgent` |
| Team | `getTeam`, `addTeamMember`, `removeTeamMember` |
| Deal Locks | `getDealLocks`, `getMyDealLocks`, `getDealLock`, `initiateDealLock`, `confirmDealLock`, `cancelDealLock` |
| Payments | `createCheckout`, `getPayments` |
| Verification | `getVerificationQueue`, `reviewVerification`, `getDocumentScans`, `getDocumentScan`, `linkDocumentToVerification`, `runFraudCheck` |
| Fraud | `getFraudStats`, `getFraudAlerts`, `getFlaggedUsers`, `getBlacklist`, `addBlacklistToken`, `removeBlacklistToken` |
| Reports | `generateReport`, `getReport`, `downloadReport`, `getMyReports`, `getLeadReport`, `getAgentReport`, `getPropertyReport` |
| Notifications | `getNotifications`, `markNotificationsRead` |
| Audit | `downloadAudit` |
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
| `Agent`, `AgentProfile` | Full profile with stats |
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
| Agents | `/admin/agents` | Full CRUD: add agent (5 sections), edit, verify/activate toggles, copy Agent ID, details modal |
| Developers | `/admin/developers` | CRUD via `UserManagementPage` |
| Admins | `/admin/admins` | CRUD via `UserManagementPage` |
| Properties | `/admin/properties` | Add/Edit/Delete/Verify/Rescore + image upload section in detail modal |
| Leads | `/admin/leads` | Full table: search + status filter, auto-assign, CRM chat panel (send WhatsApp) |
| Appointments | `/admin/appointments` | Table with confirm/cancel/complete actions, status filter |
| Verification | `/admin/verification` | Signal score bar, doc scans modal, Approve/Reject/Dispute with notes |
| Deal Locks + Payments | `/admin/deals` | Two-tab page: deal locks (confirm/cancel/timer) + payments table |
| Fraud Monitor | `/admin/fraud` | 8 stat cards, severity-coded alert feed, flagged users, blacklist CRUD |
| Reports | `/admin/reports` | Lead funnel + property inventory with **weekly/monthly bar charts** (period toggle), agent performance table |
| Audit Log | `/admin/audit` | Table of all AI property audits — risk score, investment grade, liquidity bar, PDF download |

### Agent Dashboard

| Page | Route | Features |
|------|-------|---------|
| Overview | `/agent` | Profile stats, lead counts, recent leads |
| My Leads | `/agent/leads` | Intent score bars, all columns, **CRM chat panel** (full thread + send WhatsApp) |
| Appointments | `/agent/appointments` | Upcoming/past split, confirm + mark-complete actions |
| My Listings | `/agent/listings` | Card grid, filter tabs, verification request, **photo upload per card**, primary image thumbnail |
| My Profile | `/agent/profile` | Read/edit profile via `PATCH /agents/me/` |

### Developer Dashboard

| Page | Route | Features |
|------|-------|---------|
| Overview | `/developer` | Summary stats |
| Inventory | `/developer/inventory` | Properties filterable by type |
| Lead Analytics | `/developer/leads` | Hot/warm/cold breakdown, full leads table |
| My Team | `/developer/team` | Team table, add-agent dropdown, remove member |
| Reports | `/developer/reports` | Report generator (4 types + input params) + history table with PDF download + **weekly/monthly trend charts** |

### Other Pages

| Page | Route | Notes |
|------|-------|-------|
| Login | `/login` | OTP flow, client role blocked |
| Payment Return | `/payments/return` | Success/cancelled/unknown states, auto-redirect countdown |

---

## Navigation (Sidebar)

| Role | Nav Items |
|------|-----------|
| Admin | Overview, System Setup, Clients, Leads, Appointments, Agents, Developers, Admins, Properties, Verification, Deal Locks, Fraud Monitor, Reports, Audit Log |
| Agent | Overview, My Leads, Appointments, My Listings, My Profile |
| Developer | Overview, Inventory, Lead Analytics, My Team, Reports |

---

## Phase 6 — Remaining Work

### High priority

| Item | Notes |
|------|-------|
| Production CORS + CSP hardening | Restrict origins to production domain only |
| Deployment to Render | `NEXT_PUBLIC_API_URL` → Render backend URL |

### Medium priority

| Item | Notes |
|------|-------|
| Pagination UI on large tables | `Pagination` component exists — wire into admin/leads, admin/properties, admin/agents |
| Agent profile edit form | Currently read-only; add editable fields for bio, cities, specializations |
| Verification request button per listing | Already in `/agent/listings` — verify URL path is correct (`/request-verification/` with hyphen) |

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
| Pagination missing on most tables | Medium | Component exists; just needs wiring into admin/leads, admin/properties, admin/agents |
| Agent profile page is read-only | Medium | Edit form not yet built |
| Notification delivery requires WhatsApp 24h window | Medium | Dashboard bell shows unread correctly; WhatsApp message may fail silently for inactive clients |
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
