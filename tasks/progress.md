# PakProp AI Web — Build Progress

**Last updated:** 2026-05-08 (session 10)
**Current phase:** Phase 3 — frontend complete + RBAC hardened + live system config

---

## Completed ✅

| Feature | File(s) |
|---------|---------|
| Next.js 15 scaffold (TypeScript, Tailwind, App Router) | `package.json`, `src/` |
| API client with JWT auto-refresh | `src/lib/api.ts` |
| Zustand auth store (persist to localStorage + cookies) | `src/store/auth.ts` |
| Role-based middleware (admin/agent/developer routes) | `src/middleware.ts` |
| Login page — OTP flow (send + verify + JWT + role redirect) | `src/app/login/page.tsx` — fixed response shape mismatch (`access/refresh` flat, not nested `tokens`) |
| Shared sidebar with role-aware nav | `src/components/layout/Sidebar.tsx` |
| Dashboard shell layout | `src/components/layout/DashboardLayout.tsx` |
| StatsCard, Badge, LoadingSpinner UI components | `src/components/ui/` |
| Admin: Overview (property stats + recent listings) | `src/app/admin/page.tsx` |
| Admin: System Setup (WhatsApp, AI, DB config panels) | `src/app/admin/setup/page.tsx` |
| Admin: Users | `src/app/admin/users/page.tsx` |
| Admin: Agents | `src/app/admin/agents/page.tsx` |
| Admin: Properties (moderation + one-click verify) | `src/app/admin/properties/page.tsx` |
| Admin: Verification queue | `src/app/admin/verification/page.tsx` |
| Agent: Overview (lead stats) | `src/app/agent/page.tsx` |
| Agent: Leads (sorted by intent score + bar chart) | `src/app/agent/leads/page.tsx` |
| Agent: Listings (card grid) | `src/app/agent/listings/page.tsx` |
| Developer: Overview | `src/app/developer/page.tsx` |
| Developer: Inventory (filterable by property type) | `src/app/developer/inventory/page.tsx` |
| Developer: Lead Analytics (hot/warm/cold breakdown) | `src/app/developer/leads/page.tsx` |
| **Admin: Deal Locks + Payments** (two-tab page) | `src/app/admin/deals/page.tsx` — Deal Locks tab: filter, confirm modal, 48h timer, cancel; Payments tab: full gateway table |
| **Admin: Fraud Monitor** (stats, alerts, flagged users, blacklist) | `src/app/admin/fraud/page.tsx` — 8 stat cards, severity-coded alert feed, flagged users table, blacklist CRUD |
| **Agent Listings: Lock badge** | `src/app/agent/listings/page.tsx` — 🔒 Locked badge on properties with active deal lock |
| `.env.local` with backend URL | `.env.local` |
| CORS fixed (backend) | `django-cors-headers` added to backend; `localhost:3000` allowed |
| Input visibility fixed globally | `globals.css` — `color-scheme: light`, dark mode removed, base input color set |
| `getUsers` / `updateUser` API calls | `src/lib/api.ts` — consume new `/auth/users/` backend endpoint |
| `getLeads` / `updateLead` API calls | `src/lib/api.ts` — consume new `/leads/` backend endpoint |
| Admin: Users — now fetches full user list | `src/app/admin/users/page.tsx` — switched from `/auth/me/` placeholder to real `/auth/users/` |
| `User` type corrected | `src/types/index.ts` — `id` is `string` (UUID), `name` nullable, `email` added |
| `AuthResponse` type corrected | `src/types/index.ts` — flat `access/refresh` fields, not nested `tokens` |
| Admin: Verification queue — fully rebuilt | `src/app/admin/verification/page.tsx` — signal score bar, doc count, red flags, inline Approve/Reject/Dispute with notes |
| Verification API calls added | `src/lib/api.ts` — `getVerificationQueue`, `reviewVerification`, `getDocumentScans`, `linkDocumentToVerification` |
| Property rescore API calls added | `src/lib/api.ts` — `rescoreProperty`, `rescoreAllProperties` — wired to new backend endpoints |
| `Property` type corrected | `src/types/index.ts` — now matches backend: `price_pkr`, `area_marla`, `legal_status`, `ai_score`, `risk_level`; removed stale `price`, `size`, `is_verified`, `bedrooms`, `listing_type`, `source` |
| Agent: Listings — fully rebuilt | `src/app/agent/listings/page.tsx` — uses `GET /properties/mine/`, filter tabs (all/verified/pending/unverified/disputed), score bar, request verification button |
| `getMyProperties` / `requestVerification` API calls added | `src/lib/api.ts` |
| Deal lock API calls added | `src/lib/api.ts` — `getDealLocks`, `getMyDealLocks`, `getDealLock`, `initiateDealLock`, `confirmDealLock`, `cancelDealLock` |
| Payment API calls added | `src/lib/api.ts` — `createCheckout`, `getPayments` |
| Fraud monitoring API calls added | `src/lib/api.ts` — `getFraudStats`, `getFraudAlerts`, `getFlaggedUsers`, `getBlacklist`, `addBlacklistToken`, `removeBlacklistToken` |
| `DealLock` + `DealLockStatus` types added | `src/types/index.ts` |
| `Payment` type added | `src/types/index.ts` |
| `Lead` type corrected | `src/types/index.ts` — `id` is `string` (UUID), added `intent`, `notes`, `assigned_agent_id`, `assigned_agent_name` |
| Admin: Overview — fixed stale field refs | `src/app/admin/page.tsx` — `p.is_verified` → `p.legal_status` |
| Admin: Properties — fixed stale field refs | `src/app/admin/properties/page.tsx` — `p.price` → `p.price_pkr`, verify action uses `legal_status`, Source column → AI Score |
| Developer: Overview — fixed stale field refs | `src/app/developer/page.tsx` — `p.listing_type` / `p.is_verified` → `p.legal_status` |
| Developer: Inventory — fixed stale field refs | `src/app/developer/inventory/page.tsx` — `p.price` → `p.price_pkr`, `p.size` → `p.area_marla`, `p.bedrooms` removed |
| `AgentProfile` + `DocumentScan` types added | `src/types/index.ts` — full `AgentProfile` matching backend `AgentSerializer`; `DocumentScan` for OCR detail view |
| Agent profile API calls added | `src/lib/api.ts` — `getAgentProfile`, `updateAgentProfile`, `getAgentsList`, `getDocumentScan` |
| **Agent: My Profile page** | `src/app/agent/profile/page.tsx` — shows stats, bio, cities/areas/specializations tags, editable fields via `PATCH /agents/me/` |
| Agent sidebar: My Profile link added | `src/components/layout/Sidebar.tsx` — 👤 My Profile nav item |
| **Agent: Overview — real profile data** | `src/app/agent/page.tsx` — loads `GET /agents/me/` for name, stats, rating, cities; falls back gracefully |
| Agent: Leads — Assigned Agent column | `src/app/agent/leads/page.tsx` — `assigned_agent_name` column added |
| Admin: Properties — Rescore buttons | `src/app/admin/properties/page.tsx` — per-row Rescore + bulk Rescore All (purple) with confirmation banner |
| Admin: Verification — Document scan modal | `src/app/admin/verification/page.tsx` — doc count is now a link that opens `ScanDetailModal` (OCR text, extracted fields, red flags, AI summary, confidence) |
| **Payments: Return page** | `src/app/payments/return/page.tsx` — styled success/cancelled/unknown states; shows deal details (property, amount, gateway, ref); auto-redirect countdown |
| **RBAC: client login blocked** | `src/app/login/page.tsx` — `role='user'` after OTP verify shows "Use WhatsApp" screen instead of storing tokens; prevents infinite redirect loop |
| **RBAC: payment return public** | `src/middleware.ts` — `/payments/return` added to `PUBLIC_PATHS`; gateway redirects work without session cookie |
| **Admin: Agents — real API data** | `src/app/admin/agents/page.tsx` — replaced placeholder with real `getAgentsList()`; per-row Verified/Active toggles via `PATCH /agents/{id}/` |
| **Admin: Users — deactivate + change role** | `src/app/admin/users/page.tsx` — Deactivate/Activate button; inline "Change Role" expander with role pills → `updateUser(id, { role })` |
| **Admin: Overview — three-section stats** | `src/app/admin/page.tsx` — Properties / Leads+Agents / Deal Locks sections with 4 stat cards each; 4 parallel queries replacing placeholder data |
| `updateAgent` API call added | `src/lib/api.ts` — `updateAgent(id, data)` → `PATCH /agents/{id}/`; used by admin agents page toggles |
| **Admin: System Setup — fully functional** | `src/app/admin/setup/page.tsx` — full rewrite; 4 live sections: WhatsApp API, AI Backend, Payment Gateway, WhatsApp Features |
| **Setup: API keys with masking** | Sensitive fields show ✓ Configured / Not set badge; blank on save keeps existing value; new value overwrites |
| **Setup: First-run warning banner** | Red banner lists every missing required key (`wa_access_token`, `wa_phone_number_id`, `wa_verify_token`, `gemini_api_key`); green banner when fully configured |
| **Setup: Payment gateway selector** | Radio card group (Manual / Safepay / bSecure); gateway-specific credential fields expand inline; only the chosen gateway is active system-wide |
| **Setup: WhatsApp feature toggles** | 10 toggle switches in 2-column grid; each toggle maps to a backend feature flag; disabled features hidden from greeting and unavailable to AI |
| **Setup: Scraper toggle** | Toggle in search settings sub-section; disables Zameen/Graana/OLX scraper when off; DB-only results returned |
| `getConfig` / `updateConfig` API calls | `src/lib/api.ts` — `GET /config/` and `PATCH /config/` |
| `SystemConfig` type added | `src/types/index.ts` — full interface with sensitive, control, feature, and computed fields |

---

## Known Gaps / Next Steps

| Item | Priority | Notes |
|------|----------|-------|
| Cookie vs localStorage token hybrid | Low | Tokens in both localStorage (axios) and cookies (middleware) — consolidate to httpOnly cookies for production |
| No pagination UI | Low | TanStack Query fetches first page only; add infinite scroll or pagination controls if counts grow |
| No client-side deal lock initiation flow | Low | `initiateDealLock` is in `api.ts` but no UI page for buyers to start a lock (WhatsApp is the primary path) |
| Fraud alert feed has no real-time push | Low | Currently polled at page load; add WebSocket or polling interval for live monitoring |

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
