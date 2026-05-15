# PakProp AI — Frontend Architecture Documentation

> **Perspective:** Architect · Tech Lead · QA Engineer  
> **Version:** 2026-05-15  
> **Repository:** `pakpropaiweb/` — the Next.js web dashboard

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Layout](#3-project-layout)
4. [Routing Architecture](#4-routing-architecture)
5. [Authentication Flow](#5-authentication-flow)
6. [Role-Based Access Control](#6-role-based-access-control)
7. [API Client Layer](#7-api-client-layer)
8. [State Management](#8-state-management)
9. [Data Fetching Strategy](#9-data-fetching-strategy)
10. [Component Architecture](#10-component-architecture)
11. [Dashboard Layouts by Role](#11-dashboard-layouts-by-role)
12. [Form Handling & Validation](#12-form-handling--validation)
13. [Type System](#13-type-system)
14. [Notification System](#14-notification-system)
15. [Security Architecture](#15-security-architecture)
16. [Build & Runtime Configuration](#16-build--runtime-configuration)
17. [QA — Known Risks & Testing Surface](#17-qa--known-risks--testing-surface)
18. [Deployment](#18-deployment)

---

## 1. System Overview

The web dashboard is the **secondary interface** for PakProp AI. It is not for clients — clients interact exclusively via WhatsApp. The dashboard serves:

- **Admin** — platform control, fraud monitoring, user/agent management, system config
- **Agent** — lead pipeline, CRM conversations, own listings, appointments
- **Developer/Agency** — org-wide lead view, team management, inventory, analytics

The frontend is a **thin API consumer**. All business logic lives in the Django backend. The frontend only renders data, handles forms, and routes users based on their role.

```
Browser
  │
  Next.js App (pakpropaiweb)
  │  ├── App Router (role-scoped routes)
  │  ├── Next.js Middleware (cookie-based auth guard)
  │  ├── Axios API Client (CSRF + JWT cookie + auto-refresh)
  │  ├── Zustand (auth state, persisted to localStorage)
  │  └── TanStack Query (server state cache)
  │
  └──── HTTP ────▶  Django Backend (pakpropai)
                        /api/v1/*
```

---

## 2. Tech Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 | SSR-ready, file-system routing, built-in middleware |
| Language | TypeScript | 5.x | Full type safety across API responses and components |
| Styling | TailwindCSS | v4 | Utility-first, no runtime overhead |
| HTTP Client | Axios | 1.16 | Interceptor support for CSRF + auto-refresh |
| Server State | TanStack Query (React Query) | v5 | Caching, background refetch, loading/error states |
| Client State | Zustand | v5 | Auth state with localStorage persistence |
| Forms | React Hook Form + Zod | 7.x + 4.x | Performance-first forms with schema validation |
| UI Helpers | `clsx` + `tailwind-merge` | latest | Conditional class merging |
| Charts | Custom `Charts.tsx` (Recharts or similar) | — | Analytics dashboards |
| React | React 19 | 19.2.4 | Concurrent features |

---

## 3. Project Layout

```
pakpropaiweb/
├── src/
│   ├── app/                           ← Next.js App Router
│   │   ├── layout.tsx                 ← Root layout (providers wrapper)
│   │   ├── page.tsx                   ← "/" redirect (handled by middleware)
│   │   ├── globals.css                ← Tailwind base styles
│   │   ├── providers.tsx              ← TanStack Query + React Query Devtools
│   │   │
│   │   ├── login/page.tsx             ← OTP login flow
│   │   ├── register/page.tsx          ← Agent self-registration form
│   │   ├── payments/return/page.tsx   ← Post-payment redirect landing
│   │   │
│   │   ├── admin/                     ← Role: admin
│   │   │   ├── layout.tsx             ← Admin shell (DashboardLayout)
│   │   │   ├── page.tsx               ← Overview / stats dashboard
│   │   │   ├── analytics/page.tsx     ← Platform analytics
│   │   │   ├── market-trends/page.tsx ← Property market trends chart
│   │   │   ├── setup/page.tsx         ← System configuration wizard
│   │   │   ├── clients/page.tsx       ← Client user list
│   │   │   ├── users/page.tsx         ← Full user management (CRUD)
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx           ← All leads (admin view)
│   │   │   │   └── duplicates/page.tsx
│   │   │   ├── appointments/page.tsx  ← All appointments
│   │   │   ├── agents/page.tsx        ← Agent management + approve/reject
│   │   │   ├── developers/page.tsx    ← Developer org management
│   │   │   ├── admins/page.tsx        ← Admin user management
│   │   │   ├── properties/
│   │   │   │   ├── page.tsx           ← Full property list + CRUD
│   │   │   │   └── compare/page.tsx   ← Side-by-side property comparison
│   │   │   ├── verification/page.tsx  ← Verification queue
│   │   │   ├── deals/page.tsx         ← All deal locks
│   │   │   ├── fraud/page.tsx         ← Fraud monitoring + blacklist
│   │   │   ├── reports/page.tsx       ← Analytics reports
│   │   │   ├── audit/page.tsx         ← Property audit reports
│   │   │   ├── audit-log/page.tsx     ← System request audit log
│   │   │   ├── notifications/page.tsx ← Notification management
│   │   │   └── settings/page.tsx      ← System config (feature flags, API keys)
│   │   │
│   │   ├── agent/                     ← Role: agent
│   │   │   ├── layout.tsx             ← Agent shell (DashboardLayout)
│   │   │   ├── page.tsx               ← Agent overview / my stats
│   │   │   ├── analytics/page.tsx     ← Personal performance analytics
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx           ← Assigned leads list + CRM
│   │   │   │   └── [id]/page.tsx      ← Lead detail + conversation thread
│   │   │   ├── appointments/page.tsx  ← Calendar + scheduled visits
│   │   │   ├── listings/page.tsx      ← Own property listings
│   │   │   ├── profile/page.tsx       ← Agent profile editor
│   │   │   └── notifications/page.tsx
│   │   │
│   │   └── developer/                 ← Role: developer
│   │       ├── layout.tsx             ← Developer shell (DashboardLayout)
│   │       ├── page.tsx               ← Developer overview
│   │       ├── analytics/page.tsx     ← Org-wide sales analytics
│   │       ├── inventory/page.tsx     ← All org property listings
│   │       ├── leads/page.tsx         ← All org leads (not scoped to one agent)
│   │       ├── team/page.tsx          ← Team members management
│   │       ├── reports/page.tsx       ← Org reports
│   │       ├── settings/page.tsx      ← Developer settings
│   │       └── notifications/page.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx    ← Sidebar + topbar shell for all roles
│   │   │   └── Sidebar.tsx            ← Role-aware navigation menu
│   │   ├── admin/
│   │   │   └── UserManagementPage.tsx ← Full user CRUD component
│   │   ├── notifications/
│   │   │   ├── NotificationsInbox.tsx ← Notification list + mark-read
│   │   │   └── NotificationPreferencesPanel.tsx
│   │   └── ui/
│   │       ├── Badge.tsx              ← Status/role badge
│   │       ├── Charts.tsx             ← Chart wrapper components
│   │       ├── LoadingSpinner.tsx     ← Spinner for async states
│   │       ├── NotificationBell.tsx   ← Bell icon with unread count
│   │       ├── Pagination.tsx         ← Page number pagination
│   │       └── StatsCard.tsx          ← Metric summary card
│   │
│   ├── lib/
│   │   ├── api.ts                     ← Axios instance + all API call functions
│   │   └── utils.ts                   ← cn() helper (clsx + tailwind-merge)
│   │
│   ├── store/
│   │   └── auth.ts                    ← Zustand auth store (persisted)
│   │
│   ├── types/
│   │   └── index.ts                   ← All TypeScript interfaces (domain types)
│   │
│   └── middleware.ts                  ← Next.js edge middleware (auth + role routing)
│
├── public/                            ← Static assets
├── next.config.ts                     ← Next.js configuration
├── tsconfig.json                      ← TypeScript config
├── postcss.config.mjs                 ← Tailwind PostCSS setup
└── .env.local                         ← Local environment variables
```

---

## 4. Routing Architecture

### Public Routes (no auth required)

```
/login              ← OTP authentication
/register           ← Agent self-registration (unauthenticated POST to /agents/register/)
/payments/return    ← Safepay/bSecure redirect landing
```

### Protected Routes (enforced by middleware.ts)

```
/admin/**           ← role = "admin"
/agent/**           ← role = "agent"
/developer/**       ← role = "developer"
```

### Route to Role Mapping

```
/ (root)     → middleware redirects to /admin | /agent | /developer based on cookie
```

### App Router Layouts

Each role has its own `layout.tsx` wrapping pages in `<DashboardLayout>`:

```
admin/layout.tsx       → DashboardLayout (admin sidebar navigation)
agent/layout.tsx       → DashboardLayout (agent sidebar navigation)
developer/layout.tsx   → DashboardLayout (developer sidebar navigation)
```

All layouts share `DashboardLayout` but the `Sidebar` component renders different nav items based on `user.role` from the Zustand auth store.

---

## 5. Authentication Flow

### Login (OTP)

```
/login page
  │
  [1] GET /api/v1/auth/csrf/
      → Backend sets csrftoken cookie
  │
  [2] User enters phone number
      POST /api/v1/auth/otp/send/  { phone }
  │
  [3] User receives OTP via WhatsApp
      POST /api/v1/auth/otp/verify/  { phone, code }
      → Backend sets:
          access_token  (HttpOnly cookie, 15min)
          refresh_token (HttpOnly cookie, 7d)
          user_role     (JS-readable cookie, 7d)
      → Response body: { user, role }
  │
  [4] Frontend:
      authStore.setAuth(user)          ← persisted to localStorage
      document.cookie = 'user_role=...' ← written for middleware routing
  │
  [5] Redirect to /admin | /agent | /developer
```

### Token Refresh

Axios response interceptor catches `401 Unauthorized`:

```typescript
if (error.response?.status === 401 && !original._retry) {
  original._retry = true;
  await axios.post('/auth/token/refresh/', {}, { withCredentials: true });
  return api(original);  // retry original request
}
// If refresh also fails → redirect to /login
```

The refresh token is sent as an HTTP-only cookie — JavaScript never sees it directly.

### Logout

```
POST /api/v1/auth/logout/
  → Backend: blacklists access_token + refresh_token, clears cookies
Frontend:
  authStore.clearAuth()                ← clears localStorage
  document.cookie = 'user_role=; Max-Age=0'
  router.push('/login')
```

---

## 6. Role-Based Access Control

### Middleware Guard (`src/middleware.ts`)

Runs at the edge (Next.js middleware) on every request:

```typescript
const ROLE_PATHS = {
  admin: '/admin',
  agent: '/agent',
  developer: '/developer',
};

// Guard logic:
// 1. Public paths → pass through
// 2. No token or no role cookie → redirect to /login
// 3. Unknown role → redirect to /login
// 4. "/" → redirect to role's base path
// 5. Wrong path for role → redirect to role's base path
```

**Two cookies are required:**
- `access_token` — proves the user is authenticated
- `user_role` — routes to the correct dashboard section (JS-readable, set by backend on login)

### Sidebar Navigation by Role

The `Sidebar` component reads `user.role` from Zustand and renders the appropriate nav items:

| Admin Nav (21 items) | Agent Nav (7 items) | Developer Nav (9 items) |
|---|---|---|
| Overview | Overview | Overview |
| Analytics | Analytics | Analytics |
| Market Trends | My Leads | Inventory |
| System Setup | Lead Detail [id] | Lead Analytics |
| Clients | Appointments | My Team |
| Leads + Duplicates | My Listings | Reports |
| Appointments | My Profile | Notifications |
| Agents | Notifications | Settings |
| Developers | | |
| Admins | | |
| Properties + Compare | | |
| Verification | | |
| Deal Locks | | |
| Fraud Monitor | | |
| Reports | | |
| Audit + System Log | | |
| Notifications | | |
| Settings | | |

---

## 7. API Client Layer

### Axios Instance (`src/lib/api.ts`)

```typescript
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // sends cookies on every request
});
```

### CSRF Interceptor

Attaches `X-CSRFToken` header on all state-mutating requests (POST, PUT, PATCH, DELETE):

```typescript
api.interceptors.request.use((config) => {
  if (MUTATING.has(config.method.toLowerCase())) {
    const token = getCookie('csrftoken');
    if (token) config.headers['X-CSRFToken'] = token;
  }
  return config;
});
```

### Auto-Refresh Interceptor

On `401` response, retries the token refresh and replays the original request once. On second failure, redirects to `/login`.

### API Function Catalog

All API calls are named functions exported from `api.ts`. No raw `axios.get()` calls in pages or components.

#### Auth (8 functions)
`sendOtp`, `verifyOtp`, `getMe`, `logout`, `getUsers`, `getUser`, `createUser`, `updateUser`

#### Leads (16 functions)
`getLeads`, `getLead`, `updateLead`, `suggestAgentsForLead`, `assignAgentToLead`, `autoAssignLead`, `getLeadConversations`, `sendLeadMessage`, `getDuplicateLeads`, `summarizeLead`, `suggestReplies`, `mergeLeads`, `getAppointments`, `createAppointment`, `updateAppointment`, `confirmAppointment`, `rescheduleAppointment`, `cancelAppointment`, `completeAppointment`

#### Properties (12 functions)
`getProperties`, `getMyProperties`, `getProperty`, `createProperty`, `updateProperty`, `deleteProperty`, `requestVerification`, `rescoreProperty`, `rescoreAllProperties`, `uploadPropertyImages`, `deletePropertyImage`, `compareProperties`, `getMarketTrends`

#### Agents (12 functions)
`getAgentProfile`, `updateAgentProfile`, `updateAgentAvailability`, `getAvailableAgents`, `getAgentsList`, `createAgent`, `updateAgent`, `deleteAgent`, `getPendingAgents`, `registerAgent`, `approveAgent`, `rejectAgent`

#### Agent Team (3 functions)
`getTeam`, `addTeamMember`, `removeTeamMember`

#### Verification (10 functions)
`getVerificationQueue`, `reviewVerification`, `getDocumentScans`, `getDocumentScan`, `linkDocumentToVerification`, `runFraudCheck`, `getFraudStats`, `getFraudAlerts`, `getFlaggedUsers`, `getBlacklist`, `addBlacklistToken`, `removeBlacklistToken`

#### Escrow / Deals (6 functions)
`getDealLocks`, `getMyDealLocks`, `getDealLock`, `initiateDealLock`, `confirmDealLock`, `cancelDealLock`

#### Reports / Analytics (11 functions)
`generateReport`, `getReport`, `downloadReport`, `getMyReports`, `getAgentPersonalReport`, `getLeadReport`, `getAgentReport`, `getPropertyReport`, `getRevenueReport`, `getBotReport`

#### Notifications (4 functions)
`getNotifications`, `markNotificationsRead`, `getNotificationPreferences`, `updateNotificationPreferences`

#### System (2 functions)
`getConfig`, `updateConfig`

---

## 8. State Management

### Architecture

Two layers of state are used:

| Layer | Tool | What It Holds | Persistence |
|---|---|---|---|
| Server state | TanStack Query | API responses, loading/error states, cache | React memory + optional localStorage |
| Client state | Zustand | Currently authenticated user + `isAuthenticated` flag | localStorage (via `persist` middleware) |

### Auth Store (`src/store/auth.ts`)

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
}
```

Persisted to `localStorage` under key `pakprop-auth`. Only `user` and `isAuthenticated` are persisted (not functions). This means the user survives page refreshes without needing to call `/auth/me/` again.

**Important:** The Zustand store is the source of truth for role-based UI rendering (which nav items appear, which role label shows in the sidebar). The `user_role` cookie is only used by Next.js middleware at the edge for route protection.

### Server State (TanStack Query)

All data-fetching pages use `useQuery` / `useMutation` from `@tanstack/react-query`. The root `providers.tsx` wraps the app in `QueryClientProvider`.

Queries are keyed by resource + params (e.g., `['leads', filters]`) and cached for the default `staleTime`. This means navigating back to a list page shows cached data instantly while a background refetch updates it.

---

## 9. Data Fetching Strategy

### Pattern: `useQuery` + typed result

```typescript
// In a page component:
const { data, isLoading, error } = useQuery({
  queryKey: ['leads', filters],
  queryFn: () => getLeads(filters).then(r => r.data),
});
```

### Pattern: `useMutation` + optimistic update / invalidation

```typescript
const mutation = useMutation({
  mutationFn: (data) => updateLead(id, data).then(r => r.data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
});
```

### File Downloads (Blob)

PDF downloads (audits, reports) use `{ responseType: 'blob' }` in Axios and programmatically trigger a browser download:

```typescript
const blob = new Blob([response.data], { type: 'application/pdf' });
const url = URL.createObjectURL(blob);
// trigger <a> download
```

### Pagination

The backend returns `{ count, next, previous, results }`. The `Pagination` component receives `count`, current page, and `PAGE_SIZE` and emits page change events that update the query params.

---

## 10. Component Architecture

### Design Principles

- **Pages are thin.** Pages fetch data and render components. No business logic in pages.
- **Components are dumb.** UI components receive data via props. They do not fetch.
- **API calls live in `lib/api.ts`.** No inline `axios.get()` in component files.
- **Types are centralized.** All interfaces live in `src/types/index.ts`.

### Shared UI Components

| Component | Purpose |
|---|---|
| `StatsCard` | Metric tile (label + value + optional trend indicator) |
| `Badge` | Colored status pill (lead status, verification status, role) |
| `Charts` | Wrapper around charting library for analytics views |
| `LoadingSpinner` | Centered spinner for async loading states |
| `Pagination` | Page number controls for list views |
| `NotificationBell` | Header bell icon with unread count badge |

### Layout Components

| Component | Purpose |
|---|---|
| `DashboardLayout` | Sidebar + header shell; wraps all authenticated pages |
| `Sidebar` | Role-aware navigation; renders nav items based on `user.role` |

### Feature Components

| Component | Location |
|---|---|
| `UserManagementPage` | `components/admin/` — full user CRUD with role filter |
| `NotificationsInbox` | `components/notifications/` — paginated notifications list |
| `NotificationPreferencesPanel` | `components/notifications/` — toggle per-category preferences |

---

## 11. Dashboard Layouts by Role

### Admin Dashboard

Primary focus: platform control and oversight.

```
Overview
  ├── StatsCards: total properties, verified, leads, active agents, scam checks, audits
  ├── Recent lead activity
  └── System health indicators

Analytics
  ├── Lead funnel chart (new → warm → qualified → closed)
  ├── Property verification rate
  ├── Revenue trend
  └── Bot usage metrics

Fraud Monitor
  ├── Real-time fraud alerts feed
  ├── Flagged user list
  └── Blacklist management (add/remove tokens)

System Setup
  ├── WhatsApp credentials status
  ├── Payment gateway configuration
  ├── Feature flag toggles
  └── Missing required config warnings
```

### Agent Dashboard

Primary focus: lead pipeline and personal performance.

```
Overview
  ├── Personal stats (assigned leads, conversion rate, active listings)
  └── Next appointments

My Leads
  ├── Filtered lead list (only assigned leads)
  ├── Status filter (new/warm/qualified/cold)
  └── Lead [id] detail:
        ├── Lead profile (budget, intent, city)
        ├── Conversation thread (WhatsApp + dashboard messages)
        ├── Send message form
        ├── AI: Summarize lead / Suggest replies
        ├── Appointment scheduling
        └── Activity timeline

My Listings
  ├── Own properties list
  ├── Create/edit property forms
  └── Request verification action
```

### Developer Dashboard

Primary focus: org-wide sales pipeline and team.

```
Overview
  ├── Org-wide stats (total leads, active agents, inventory count)
  └── Top-performing agents

Lead Analytics
  ├── All org leads (cross-agent visibility)
  ├── Pipeline stage distribution
  └── Source breakdown (WhatsApp, web, referral)

Inventory
  ├── All org properties
  ├── Create/edit listings
  └── Bulk actions

My Team
  ├── Agent list (org members)
  ├── Add/remove team members
  └── Per-agent performance metrics
```

---

## 12. Form Handling & Validation

### Stack: React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  phone: z.string().min(10).max(15),
  name: z.string().min(2).optional(),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { phone: '' },
});
```

### Form Locations

| Form | Location | Fields |
|---|---|---|
| OTP Login | `login/page.tsx` | phone, code |
| Agent Registration | `register/page.tsx` | name, phone, type, cities, specializations |
| Property Create/Edit | `admin/properties/page.tsx` | all property fields |
| Lead Update | `agent/leads/[id]/page.tsx` | status, notes |
| Send Message | `agent/leads/[id]/page.tsx` | body (text) |
| System Config | `admin/settings/page.tsx` | API keys, feature flags |
| Agent Profile | `agent/profile/page.tsx` | all agent fields |
| Notification Preferences | notification preferences panel | boolean toggles |

---

## 13. Type System

All domain types are defined in `src/types/index.ts`. Every API response maps to one of these types. TypeScript's strict mode is enabled.

### Core Types

```typescript
type Role = 'admin' | 'agent' | 'developer' | 'client'

User            { id, phone, name, role, is_active, ntn, cnic, is_filer }
Property        { id, title, city, legal_status, ai_score, risk_level, images[] }
Lead            { id, phone, budget_min, budget_max, status, intent, assigned_agent_id }
ConversationMessage { id, direction, channel, body, wa_message_id }
Appointment     { id, lead, property, agent, scheduled_at, status }
Agent           { id, name, phone, cities, specializations, is_verified }
AgentProfile    { ...full profile fields, availability_status, registration_status }
DealLock        { id, property, buyer, seller, token_amount, status, lock_expires_at }
VerificationRequest { id, status, signal_score, property_id, document_count }
DocumentScan    { id, document_type, owner_name, red_flags, confidence, status }
Payment         { id, amount_pkr, gateway, status, reference }
Notification    { id, title, channel, message, status, is_read }
SystemConfig    { ...all feature flags, API key status, setup_complete, missing_required }
Report          { id, report_type, status, file_url }
MarketTrend     { period, avg_price_pkr, listing_count }
StatsOverview   { total_properties, verified_properties, total_leads, active_agents }
ApiError        { detail?, message?, [key: string]: unknown }
```

### Type Safety on API Calls

All `api.ts` functions return `Promise<AxiosResponse<T>>` (implied). Pages destructure with explicit types:

```typescript
const { data } = await getLeads();
const leads: Lead[] = data.results;
```

---

## 14. Notification System

### In-App Notifications

`NotificationBell` component polls for unread notification count. When clicked, it opens `NotificationsInbox`.

```
GET /api/v1/notifications/           → list with is_read filter
POST /api/v1/notifications/mark-read/ → mark specific IDs or all as read
```

### Notification Preferences

Users can configure per-channel and per-category preferences:

```
Channels:  whatsapp_enabled | sms_enabled | email_enabled
Categories: lead_updates | appointment_reminders | deal_updates | report_ready | marketing
```

Preferences are read/written via:
```
GET  /api/v1/auth/me/notification-preferences/
PATCH /api/v1/auth/me/notification-preferences/
```

---

## 15. Security Architecture

### Cookie-Based Auth (Dashboard)

- `access_token`: HTTP-only, not readable by JavaScript — prevents XSS token theft
- `refresh_token`: HTTP-only — silent refresh via `/auth/token/refresh/`
- `user_role`: JS-readable — only used for UI routing, not for authorization decisions
- `csrftoken`: JS-readable — read to set `X-CSRFToken` header on mutations

### CSRF Protection

All state-mutating requests (POST/PUT/PATCH/DELETE) include `X-CSRFToken` header sourced from the `csrftoken` cookie. The backend's `CsrfViewMiddleware` validates this.

### Route Protection

**Two layers:**

1. **Edge middleware (`src/middleware.ts`):** Runs before any page renders. Redirects unauthenticated or wrong-role users based on cookies.
2. **API layer:** Even if middleware is bypassed, every API call checks the JWT on the backend. The correct role is enforced server-side.

### XSS Prevention

- No `dangerouslySetInnerHTML` usage
- All user-supplied content rendered as text, not HTML
- React's default JSX escaping prevents injection

### No Sensitive Logic in Frontend

- No business rules in frontend code
- No authorization decisions in JavaScript — all enforced by backend RBAC
- Feature flags read from `/api/v1/config/` — not hardcoded in frontend

---

## 16. Build & Runtime Configuration

### Environment Variables

```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Production (Vercel / Render)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

### `next.config.ts`

Standard Next.js configuration. No special customization documented beyond Vercel deployment target.

### `vercel.json`

Present in repo root — configures deployment for Vercel platform.

### TypeScript Config

Strict mode enabled. `@/*` path alias maps to `src/`.

### PostCSS / Tailwind v4

Tailwind CSS v4 (PostCSS plugin approach). No `tailwind.config.js` needed — configuration is in `postcss.config.mjs`.

---

## 17. QA — Known Risks & Testing Surface

### High-Risk Areas

| Area | Risk | What to Verify |
|---|---|---|
| Cookie-based auth in middleware | `user_role` cookie can be tampered by user | Backend always re-validates JWT; frontend role is UI-only |
| CSRF on refresh | Refresh endpoint must not require CSRF | `POST /auth/token/refresh/` is cookie-only, no body — check CSRF exemption in backend |
| Auto-refresh loop | 401 → refresh → 401 → infinite loop | `_retry` flag prevents second attempt; test manually |
| Role redirect | Wrong `user_role` cookie → wrong dashboard | Middleware only routes; backend RBAC rejects unauthorized data requests |
| Pagination offset | Page 2+ shows wrong data if items deleted | Test pagination with concurrent mutations |
| File download (blob) | Large PDFs block main thread | Downloads are async; verify for 10MB+ files |
| Zustand hydration | `isAuthenticated` stale after JWT expiry | Next refresh silently re-authenticates; Zustand doesn't know token expired |
| Parallel mutations | Double-submitting forms | `mutation.isPending` should disable submit buttons — audit all forms |

### Testing Surface

| Layer | What to Test |
|---|---|
| Middleware | Unauthenticated access → /login; wrong role → correct base path |
| Login flow | OTP send → OTP verify → cookie set → role redirect |
| Logout | Cookies cleared, Zustand cleared, redirect to /login |
| Auth store | `setAuth` persists to localStorage; `clearAuth` removes it |
| API client | CSRF header attached on POST/PATCH; absent on GET |
| Auto-refresh | 401 triggers refresh, original request retried |
| Role scoping | Agent cannot navigate to /admin routes |
| Forms | Zod validation errors displayed; valid submit calls correct API function |
| Notification bell | Unread count updates after `mark-read` mutation |

### Current Test Coverage

No automated tests are currently written. The recommended test priority order:

1. Next.js middleware route guard (unit test)
2. Auth store (Zustand) set/clear behavior
3. Axios CSRF interceptor
4. Login page flow (integration)
5. Role-specific nav rendering in Sidebar

---

## 18. Deployment

### Commands

```bash
npm run dev      # development server (turbopack)
npm run build    # production build
npm start        # start production server
npm run lint     # ESLint check
```

### Recommended Platforms

| Platform | Notes |
|---|---|
| Vercel | Native Next.js support; `vercel.json` already configured |
| Render | Static site or Node server deployment option |

### Environment Setup for Production

```bash
NEXT_PUBLIC_API_URL=https://api.pakpropai.com/api/v1
```

The backend must set `CORS_ALLOWED_ORIGINS` to include the deployed frontend domain and `CSRF_TRUSTED_ORIGINS` to match.

### Cross-Origin Cookie Requirements

For cookie-based auth to work across domains (e.g., `app.pakpropai.com` → `api.pakpropai.com`):
- Cookies must use `SameSite=None; Secure` in production
- Backend must set `SESSION_COOKIE_SAMESITE=None` and `CSRF_COOKIE_SAMESITE=None`
- HTTPS is mandatory for `SameSite=None`

Alternatively, hosting both on the same domain (e.g., `/api` proxied) avoids this entirely.

---

*End of Frontend Architecture Documentation*
