# Specifications — Index

This folder holds the specification for what you're building. Durable, cross-project conventions
(coding style, git conventions, security baseline) live in [../CLAUDE.md](../CLAUDE.md) instead —
that file is auto-loaded every session, this folder is read selectively.

Specs are split by concern so you can update one without touching the others, and so you can hand
Claude only the file(s) relevant to the feature you're working on rather than the whole document.

| File | Covers |
|---|---|
| [functional.md](functional.md) | Product overview, user roles, use cases / user stories, in/out of scope |
| [data-model.md](data-model.md) | Entities, master data vs. transactional data, relationships |
| [ui-guidelines.md](ui-guidelines.md) | Design system, branding, key flows, accessibility |
| [security.md](security.md) | Auth/authz model, data protection, compliance, threat model |
| [performance.md](performance.md) | Response time, concurrency, scalability targets |

## How to use this per project

1. Copy this whole repo (`CLAUDE.md` + `specifications/`) as the starting point for a new app.
2. Fill in `functional.md` and `data-model.md` first — you need a rough shape of what you're
   building and what data it touches before performance/security targets mean anything concrete.
3. Fill in `ui-guidelines.md`, `security.md`, `performance.md` at whatever level of detail you
   actually have opinions on. `[TODO]` left unfilled is fine — better than a guess baked in early.
4. Start building. For each feature: open Plan Mode, point Claude at the relevant spec file(s),
   review the plan, then build. Don't try to finish every spec file before writing any code —
   for a complex app you will discover requirements while building, not before.
5. When a feature reveals the spec was wrong or incomplete, update the spec file as part of that
   feature's work, not as separate cleanup later.

## What's deliberately *not* here

- **Execution / Testing / Deployment** aren't spec sections in this template. They're workflow —
  they happen via the plan → build → test → commit loop per feature (and CI/deployment config
  once you have one), not a document you write once upfront. Trying to spec "testing" in the
  abstract before any code exists tends to produce boilerplate that doesn't match what the app
  actually needs tested.
- **Design of individual screens/modules** isn't a separate phase either — it happens inside Plan
  Mode for the feature that needs it, informed by `ui-guidelines.md` and `data-model.md`. Only the
  durable, cross-feature design decisions (design system, branding, overall IA) belong in
  `ui-guidelines.md`.
