# Security Requirements

The project-wide default posture (validate input, no secrets in code, default-deny authz) is in
[../CLAUDE.md](../CLAUDE.md) and applies regardless of what's filled in below. This file is for
requirements specific to *this app* — its data sensitivity, its auth model, its compliance scope.

## Data Sensitivity

- What's the most sensitive data this app stores (PII, payment, health, none): PII (names,
  emails, phone numbers, shipping/billing addresses, seller registration numbers and IBANs) plus
  payment metadata. No raw card data is ever stored — Stripe holds that; we only store Stripe
  references (payment intent IDs, Connect account IDs). Seller IBANs are the most sensitive field
  we do store directly.
- Any regulatory scope (GDPR, HIPAA, PCI-DSS, SOC 2, none): GDPR (Romanian/EU buyers and sellers)
  and PCI-DSS — PCI scope is minimized to SAQ-A level by never handling raw card data ourselves
  (Stripe Elements/Checkout collects card details directly, they never touch our backend).

## Authentication

- Method: Email/password (bcrypt-hashed) with optional Google OAuth as an alternative sign-in.
  Both paths create/attach to the same `User` record (see data-model.md).
- Session handling: JWT — short-lived access token (~15 min) + longer-lived refresh token (~7-30
  days, stored as an httpOnly, secure, SameSite cookie). Refresh tokens are revocable (stored
  server-side, e.g. a `refresh_tokens` table or Redis, so logout/compromise can invalidate them
  individually rather than only relying on expiry).
- MFA required: Yes, for Admin and Support roles only (TOTP-based, e.g. Google Authenticator
  compatible). Not required for Buyer/Seller at launch, but Sellers should be encouraged to enable
  it given they manage payout/IBAN data — revisit making it mandatory for Sellers post-launch.

## Authorization

- Model: Role-based (Buyer, Seller, Admin, Support — tied to the roles in
  [functional.md](functional.md)), combined with ownership checks for Seller resources (a Seller
  may only act on Products/OrderItems/Payouts tied to their own `SellerProfile.id`).
- Where enforcement happens: Server-side only, in the Express service layer (per
  [../CLAUDE.md](../CLAUDE.md) architecture principles) — never trust a role/ownership claim from
  the client. Route-level middleware checks JWT role claim first (coarse gate by path prefix:
  `/api/seller/*`, `/api/admin/*`, `/api/support/*`); the service layer then re-checks ownership
  on every read/write (e.g. "does this OrderItem.seller_id match the authenticated seller?") since
  role alone isn't sufficient for multi-tenant data isolation.

## Data Protection

- Encryption at rest: Yes — rely on Railway/Postgres-managed encryption at rest for the database;
  additionally application-level encryption for the most sensitive individual fields (Seller
  IBAN, MFA TOTP secret) so they're not readable from a raw DB dump/backup alone.
- Encryption in transit: HTTPS everywhere (frontend, API, and DB connections), no exceptions —
  enforced at the hosting/proxy level (Railway) and via HSTS.
- Fields requiring extra protection: `SellerProfile.iban` and `User.mfa_secret` (encrypted
  columns, per above); `Order.shipping_address_snapshot`/`billing_address_snapshot` and
  `Address` fields (masked/redacted in application logs); `Payment`/`Payout` amounts are not
  secret but should never appear in logs alongside PII in plaintext beyond what's needed for
  debugging.

## Threat Model (lightweight)

Not a full STRIDE exercise — just the obvious risks for this specific app.

- Biggest realistic threat to this app: cross-seller data leakage (a Seller viewing/modifying
  another seller's orders, products, or payout data) due to a missing ownership check — this is
  the most likely and most damaging class of bug in a multi-vendor marketplace, and is why every
  Seller-scoped endpoint requires an explicit ownership check in the service layer, not just a
  role check (see Authorization above). Second: payment/webhook spoofing (a forged Stripe webhook
  triggering a false "payment succeeded" state) — mitigated by verifying Stripe webhook
  signatures on every incoming event, never trusting an unsigned payload.
- Anything explicitly out of scope for launch (accepted risk, revisit later): formal PCI-DSS
  attestation/audit (relying on Stripe's SAQ-A-eligible integration pattern instead); a full
  bug-bounty or third-party penetration test; rate-limiting/WAF beyond basic
  Express-level rate limiting on auth endpoints.

## Audit / Logging

- What actions must be logged for audit purposes (see `AuditLog` in
  [data-model.md](data-model.md)): seller approval/rejection/suspension, commission rate changes,
  manual refunds (especially any issued beyond a Support agent's configured limit), product/
  listing removals by Admin, review moderation (flag/remove), Support agent account creation/
  deactivation, ticket escalations. Routine buyer/seller self-service actions (editing their own
  product, updating their own address) are not audit-logged — only privileged/cross-user actions
  are.
- Log retention: `AuditLog` table rows are retained indefinitely (append-only, no purge). Plain
  application/error logs (not the AuditLog table) follow whatever Railway's default log retention
  is at launch — revisit if a longer window is needed for incident investigation.
