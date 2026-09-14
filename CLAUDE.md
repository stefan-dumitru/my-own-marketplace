# Project Conventions

This file is auto-loaded by Claude Code on every session in this project. Put here only what
should apply to *every* prompt and *every* feature — durable conventions, not what you're
building. What you're building lives in [specifications/](specifications/SPECS.md).

## Tech Stack

- Language / runtime: TypeScript everywhere (Node.js backend, React frontend). No plain JS files.
- Framework(s): React (Vite) frontend, Express.js backend, REST API (not GraphQL). React Router
  for routing, TanStack Query for server-state/data-fetching, React Hook Form for forms.
- Database: PostgreSQL, accessed via Prisma ORM (Prisma migrations are the source of truth for
  schema changes — no hand-written SQL migrations unless Prisma can't express something).
- Hosting / deployment target: Railway (frontend, backend, and PostgreSQL all on Railway).
- Key libraries you want defaulted to (avoid AI picking a random alternative):
  - UI: shadcn/ui components + Tailwind CSS
  - Validation: Zod (shared schemas between frontend and backend where possible)
  - Auth: JWT (access + refresh tokens), bcrypt for password hashing, Passport.js or a thin
    custom layer for Google OAuth
  - Payments: Stripe, using Stripe Connect for multi-vendor seller payouts/commission splitting
  - Client state: Zustand for local/UI state (TanStack Query already owns server state)
  - MFA (admin/support only): TOTP via `otplib` or equivalent

## Architecture Principles

- Monorepo with two top-level apps: `/client` (React/Vite) and `/server` (Express). A `/shared`
  package holds TypeScript types and Zod schemas used by both, so request/response shapes aren't
  duplicated.
- Backend is layered: routes → controllers (HTTP concerns only) → services (business logic,
  authorization checks, seller-ownership checks) → Prisma (data access). Controllers should not
  contain business logic; services should not touch `req`/`res`.
- Multi-vendor isolation is enforced in the service layer, not just the UI: a seller's queries are
  always scoped to their own `sellerId`, checked server-side on every request.
- REST resource structure mirrors the roles in `specifications/functional.md` (e.g. `/api/buyer/*`,
  `/api/seller/*`, `/api/admin/*`, `/api/support/*`) so authorization middleware can gate by
  path prefix + role.

## Security Baseline   -   No need to change it between projects

Applies to every feature by default, not just ones flagged "security-sensitive". Full,
app-specific requirements live in [specifications/security.md](specifications/security.md).

- No secrets in code or commit history; use `.env` files locally (gitignored) and Railway
  environment variables in deployed environments. Never commit Stripe keys, JWT signing secrets,
  or DB connection strings.
- Validate and sanitize all input at trust boundaries (API edges, form submissions) using the
  shared Zod schemas — validate on the server even when the client already validated.
- Default-deny authorization; check access on every request, not just at the UI layer. Every
  `/api/seller/*` and `/api/admin/*` route must verify role + ownership server-side.
- MFA (TOTP) is required for Admin and Support roles; never store raw card data — Stripe handles
  all card data (PCI-DSS scope stays minimal because of this).

## Working With AI On This Project

This project is built iteratively, not from one giant upfront prompt:

1. Before implementing a non-trivial feature, use **Plan Mode**. Point Claude at the relevant
   file(s) in `specifications/` for that feature — you rarely need all of them at once.
2. Claude proposes a plan grounded in the spec *and* the current state of the codebase (specs
   describe intent; the code is the source of truth for what already exists). Review and correct
   before it builds.
3. Specs are living documents. If building a feature reveals the spec was wrong, incomplete, or
   just aspirational, update the spec file — don't silently build around the gap and leave the
   doc stale.
4. Keep this file (`CLAUDE.md`) limited to things true across the whole project. If a rule only
   applies to one feature, it belongs in a plan or a code comment, not here.
