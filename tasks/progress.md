# PakProp AI Web — Build Progress

**Last updated:** 2026-05-08 (session 3)
**Current phase:** Phase 2 (dashboard MVP)

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

---

## Known Gaps / Next Steps

| Item | Notes |
|------|-------|
| ~~Backend `/leads/` endpoint missing~~ | ✅ Fixed — `GET /api/v1/leads/` and `PATCH /api/v1/leads/<id>/` now live |
| ~~Backend user list endpoint missing~~ | ✅ Fixed — `GET /api/v1/auth/users/` now live (admin only) |
| Admin Setup page is UI-only | Config values need to POST to a backend settings API or be set manually in `.env` |
| Cookie vs localStorage hybrid | Tokens in both localStorage (for axios) and cookies (for middleware) — clean up to use httpOnly cookies if security is critical |
| No pagination UI | TanStack Query fetches page 1 only — add pagination controls if counts grow |
| Agent listings page has no backend data | `/api/v1/properties/` exists but page needs filtering by agent — use `GET /properties/?owner=me` via the existing `mine` action |
| Document scan detail view missing | Admin can see scan list but no drill-down to view full OCR text and extracted fields |

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
