# PakProp AI Web — Build Progress

**Last updated:** 2026-05-08 (session 7)
**Current phase:** Phase 3 — all core dashboard pages built

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

---

## Known Gaps / Next Steps

| Item | Priority | Notes |
|------|----------|-------|
| Admin Setup page is UI-only | Low | Config values need `.env` changes on the backend; no settings API built yet |
| Cookie vs localStorage token hybrid | Low | Tokens in both localStorage (axios) and cookies (middleware) — consolidate to httpOnly cookies for production |
| No pagination UI | Low | TanStack Query fetches first page only; add infinite scroll or pagination controls if counts grow |
| Document scan detail view missing | Medium | Admin can see scan list but no drill-down to view full OCR text/extracted fields |
| Admin Properties page has no rescore button | Medium | `rescoreProperty` / `rescoreAllProperties` are wired in `api.ts` but no UI trigger — add button to admin properties page |
| Agent overview page — profile not loaded | Medium | Backend `GET /api/v1/agents/me/` is live; agent overview page still shows placeholder stats instead of real profile |
| Lead tables missing `assigned_agent_name` column | Low | Field is in serializer; needs to be added to agent/admin lead table UI |
| Payment return page is raw JSON | Low | `/payments/return/?status=success&deal_id=<uuid>` returns JSON — replace with a styled Next.js page |
| No client-side deal lock initiation flow | Medium | `initiateDealLock` is in `api.ts` but no UI page for buyers to start a lock from the dashboard (WhatsApp is the primary path) |
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
