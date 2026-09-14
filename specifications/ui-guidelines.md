# UI / Design Guidelines

Only the cross-feature, durable design decisions go here. Layout of an individual screen belongs
in that feature's Plan Mode session, informed by this file — not spec'd upfront here.

## Design System

- Component library / design system: shadcn/ui components + Tailwind CSS. Build new UI by
  composing shadcn primitives rather than hand-rolling equivalents (buttons, dialogs, forms,
  tables, dropdowns, toasts, etc. all come from shadcn/ui).
- Brand colors / typography: starting palette (change freely once you have a logo/brand direction
  — nothing here is final):
  - Primary accent: `#E63946` (warm red — energetic, retail-appropriate, distinct from the
    blue most marketplaces default to)
  - Neutral scale: Tailwind's default `slate` scale for backgrounds/borders/text
  - Success: `#2A9D8F` (order confirmed, in stock) · Warning: `#F4A261` (low stock) · Danger:
    `#E63946` reused, or Tailwind `red-600` for destructive actions to avoid clashing with the
    brand accent
  - Typography: Inter (system-ui fallback) for UI text; no separate display font needed at
    launch
- Light/dark mode: both required. Use Tailwind's `dark:` variant + shadcn's theming (CSS
  variables), with a user-toggleable preference stored per-user (default: follow OS preference).
- Responsive targets (mobile, tablet, desktop — which are must-support): mobile and desktop are
  must-support; tablet is best-effort (should not visibly break, not separately designed).

## Information Architecture

- Top-level navigation structure:
  - Public/buyer-facing: Home → Category mega-menu → Search → Product page → Cart → Checkout →
    Order history / Account. Persistent header: logo, search bar, cart icon, account menu.
  - Seller area: separate dashboard shell (`/seller/*`) — Products, Orders, Payouts, Reviews,
    Support, Profile/settings. Reachable from the account menu once a user has an approved
    SellerProfile.
  - Admin area: separate dashboard shell (`/admin/*`) — Sellers (approval queue), Categories,
    Commission settings, Moderation, Audit log, Support agent management.
  - Support area: separate dashboard shell (`/support/*`) — Ticket queue, ticket detail/thread.
- How roles map to what nav/screens they see: a single logged-in user only ever sees the nav for
  their role(s) — buyer nav is the default for everyone; `/seller`, `/admin`, `/support` shells
  are only reachable (and only rendered) for users whose role/SellerProfile grants access. No
  role-mixing in one screen (an Admin viewing seller tools does so via impersonation/support
  tooling if ever needed, not a merged UI).

## Key Flows

Flows that span multiple screens/features and need to feel consistent:

- **Buyer onboarding & checkout**: browse/search → product page → add to cart (multi-seller) →
  cart review → address selection → Stripe payment → confirmation → order tracking. Must feel
  like one continuous flow even though it touches Product, Cart, Order, and Payment.
- **Seller onboarding**: registration form (business details, IBAN) → pending-approval state
  (clear messaging that listings are blocked until approved) → approval notification → first
  product listing flow. Should make the "why can't I list yet" state obvious, not a dead end.
- **Admin seller approval**: queue of pending SellerProfiles → review detail → approve/reject with
  a required reason on rejection → seller notified. Every action here writes an AuditLog entry;
  the UI should make it clear an action is being logged (not a hidden side effect).
- **Support ticket resolution**: ticket queue → ticket detail (with order context inline, not a
  separate lookup) → reply/resolve/escalate. Escalation should visibly hand off to Admin, not
  silently change status.

## Accessibility

- Target conformance level: WCAG 2.1 AA (best-effort, not formally audited pre-launch, but design
  and build with AA in mind from the start rather than retrofitting).
- Specific requirements:
  - Full keyboard navigation for checkout and the seller/admin dashboards at minimum (the
    money-touching flows).
  - Sufficient color contrast for the brand palette above — verify text-on-accent combinations
    meet AA contrast when finalizing the palette.
  - All interactive icons (cart, wishlist heart, etc.) need accessible labels, not icon-only with
    no text alternative.
  - Form errors (checkout, seller product forms) must be programmatically associated with their
    fields, not color-only indicators.
