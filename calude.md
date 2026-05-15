# PakProp AI Web Frontend Context

You are working inside:

pakpropaiweb/

This repository is the FRONTEND / WEB DASHBOARD layer for PakProp AI.

---

# Core Product Understanding

PakProp AI is NOT:

- A listing platform
- A CRM
- A marketplace

PakProp AI IS:

→ A Trust Infrastructure Layer for Pakistani Real Estate

The frontend MUST reflect this product philosophy.

---

# Product Flow (MANDATORY)

All frontend experiences MUST support:

DISCOVER → VERIFY → DECIDE → CONNECT → TRANSACT

Feature mapping:

- Discover → Property search and listings
- Verify → Scam checks and verification UI
- Decide → AI insights, tax, loan, scoring
- Connect → Agent communication
- Transact → Deal lock and escrow flows

If a UI feature does NOT support this flow:
→ it is secondary.

---

# Frontend Role

This repository is ONLY responsible for:

- Admin dashboard
- Agent dashboard
- Developer dashboard
- Internal operational interfaces
- Web management panels

IMPORTANT:

PakProp AI is:

→ WhatsApp-first

This web application is a SECONDARY operational interface.

Do NOT redesign the system as a web-first platform.

---

# Architecture Rules

Frontend MUST:

- Consume APIs from pakpropai backend
- NEVER duplicate backend business logic
- NEVER move business rules into frontend
- Keep frontend thin and API-driven
- Remain modular and maintainable

Frontend is a presentation layer.

Backend remains the source of truth.

---

# Backend Dependency

Main backend repository:

../pakpropai

Core system rules are defined in:

../pakpropai/CLAUDE.md

Claude MUST follow that file for:

- Product architecture
- System constraints
- Business logic
- Engineering decisions
- AI workflows
- WhatsApp-first design principles

If conflicts occur:

→ backend CLAUDE.md wins.

---

# Preferred Frontend Stack

Mandatory stack:

- Next.js
- TypeScript
- TailwindCSS

Preferred additions:

- TanStack Query
- Zustand (light state only)
- React Hook Form
- Zod

Avoid unnecessary libraries.

---

# UI/UX Principles

Design MUST be:

- Fast
- Clean
- Minimal
- Operationally efficient
- Mobile responsive
- Urdu + English friendly

Avoid:

- Overly complex UI systems
- Heavy animations
- Enterprise-style dashboard clutter
- Unnecessary abstractions

---

# Dashboard Scope

## Admin Dashboard

Includes:

- Fraud monitoring
- Verification moderation
- User management
- Property moderation
- AI monitoring 
- Setting the system for first use

---

## Agent Dashboard

Includes:

- Listings
- Leads
- Lead quality
- Conversation tracking
- Property management

---

## Developer Dashboard

Includes:

- Inventory management
- Lead analytics
- Project visibility
- Campaign tracking

---

# API Rules

Frontend MUST:

- Use centralized API clients
- Use environment variables
- Handle API failures gracefully
- Implement token refresh correctly
- Avoid direct database assumptions

Never hardcode API URLs.

---

# Authentication Rules

Use:

- JWT authentication
- RBAC system

Roles:

- User
- Agent
- Developer
- Admin

Frontend MUST respect permission boundaries.

---

# State Management Rules

Keep state minimal.

Use:

- Server state → TanStack Query
- Local UI state → Zustand or React state

Avoid:

- Massive global stores
- Complex frontend business workflows

---

# Performance Rules

Always optimize for:

- Low bandwidth
- Fast loading
- Minimal API calls
- Reusable components
- Mobile responsiveness

Pakistan-first performance matters.

---

# Engineering Rules

Always:

- Build MVP-first
- Keep code simple
- Prefer reusable components
- Optimize developer speed
- Think startup-first

Never:

- Over-engineer
- Add premature abstractions
- Build unnecessary frontend infrastructure
- Recreate backend validation logic

---

# Development Workflow

Before starting work:

- Understand backend APIs first
- Review existing architecture
- Maintain consistency

After changes:

- Verify UI behavior
- Test API integration
- Check responsive layouts
- Validate auth flows

---



---

# Important Constraint

The frontend is NOT the product core.

The core product is:

- Trust
- Verification
- AI intelligence
- WhatsApp interaction

The frontend exists to SUPPORT operations around that ecosystem.

---

# Goal

Build a lightweight, scalable operational frontend for PakProp AI that is:

- Lean
- Fast
- Maintainable
- API-driven
- Cost-efficient
- Production-ready