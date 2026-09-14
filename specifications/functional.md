# Functional Specification

## Product Overview

- What is this app, in 2-3 sentences: stefanmarket is a multi-vendor e-commerce marketplace
  modeled on emag.ro. Third-party sellers register, get approved, and list products across
  categories; buyers browse, search, purchase from one or more sellers in a single checkout, and
  track orders. The platform takes a commission on each sale and handles payment collection and
  seller payouts.
- Who is it for: Primarily the Romanian market (buyers and sellers), general consumer retail
  (electronics, home goods, fashion, etc. — broad catalog, not a single vertical).
- Core problem it solves / why it needs to exist: Gives small/independent sellers a storefront
  and payment/logistics backbone they'd otherwise have to build themselves, while giving buyers a
  single place to search and check out across many sellers.

## User Roles

| Role | Description | Can do | Cannot do |
|---|---|---|---|
| Buyer | Registered or guest shopper | Browse/search catalog, manage cart, checkout across multiple sellers in one order, pay via Stripe, track order status, view order history, leave reviews on purchased products, manage addresses, wishlist products, open support tickets | Access other buyers' data, modify product listings or prices, see seller payout/commission info, act as a seller without completing seller onboarding |
| Seller (vendor) | Registered third-party seller, approved by Platform Admin | Manage their own product listings (create/edit/deactivate), manage stock, view and fulfill their own order items, view their own sales/payout history, respond to reviews on their products, open support tickets | Access another seller's products, orders, or payout data; approve their own seller account; see other sellers' commission rates; edit platform-wide categories |
| Platform Admin | Internal staff, full platform oversight | Approve/suspend/reject sellers, manage the category tree, set/override commission rates, view and moderate all orders/products/reviews, resolve escalated disputes, manage Support agent accounts, view platform-wide audit logs | Directly edit a seller's product data without an audit trail entry |
| Support / Customer Service agent | Internal staff, handles day-to-day tickets | View and respond to buyer/seller support tickets, view order details relevant to a ticket, issue refunds within a pre-set limit, escalate disputes to Admin | Approve/suspend sellers, change commission rates, edit the category tree, access platform-wide audit logs beyond their own actions |

Buyer and Seller are both backed by the same base `User` account; a user can hold the Seller role
in addition to being a Buyer (see [data-model.md](data-model.md)). Admin and Support are
platform-staff-only roles, not self-service signups.

## Use Cases

### Buyer
- Search/browse products by category, keyword, price range, rating, and seller.
- View a product page with images, description, price, stock status, seller info, and reviews.
- Add items from multiple sellers to a single cart and complete one checkout/payment; the order
  is split into per-seller order items behind the scenes (see data-model.md).
- Pay via Stripe (card); see order confirmation and track status (placed → paid → shipped by each
  seller → delivered).
- Leave a rating + review on a product after a verified purchase.
- Manage saved addresses, view order history, maintain a wishlist.
- Open a support ticket for an order issue (not received, wrong item, refund request).

### Seller
- Register with company details (name, registration/CUI, IBAN for payouts) → status starts
  `pending` until a Platform Admin approves it.
- Once approved: create/edit product listings (title, description, images, price, stock,
  category, variants), activate/deactivate listings.
- View incoming orders scoped to their own products only, update fulfillment status per order
  item (e.g. mark as shipped, add tracking).
- View their sales history and payout schedule/history (commission already deducted).
- Respond publicly to reviews left on their products.
- Open a support ticket for platform issues (payout problems, disputes with a buyer).

### Platform Admin
- Review pending seller applications, approve/reject/suspend sellers.
- Manage the category tree (create/edit/archive categories).
- Set the default commission rate and override it per seller if needed.
- Moderate flagged products/reviews; remove listings that violate policy.
- View platform-wide audit log of sensitive actions (seller approvals, commission changes,
  manual refunds, listing removals).
- Manage Support agent accounts (create, deactivate).

### Support / Customer Service agent
- View and triage open support tickets from buyers and sellers.
- View order/payment details needed to resolve a ticket.
- Issue a refund up to a configured limit without Admin approval; escalate larger/disputed cases.
- Close resolved tickets; all actions are logged against the agent's account.

## In Scope (v1)

- Multi-vendor product catalog with categories, search, and filtering.
- Cart and checkout spanning multiple sellers in one order (order splits per seller internally).
- Stripe payment collection + Stripe Connect payouts to sellers, minus commission.
- Seller onboarding/approval workflow.
- Product reviews and ratings (post-purchase, moderated).
- Buyer order tracking, order history, wishlist, saved addresses.
- Support ticketing system (buyer/seller ↔ Support agent).
- Admin dashboard: seller management, category management, commission config, moderation, audit
  log.

## Out of Scope (v1 — revisit later)

- Native mobile apps (web-responsive only for v1).
- Real-time courier/shipping-provider API integration (v1 tracks status manually/by seller input,
  not a live carrier API).
- Live chat (support is ticket-based, not real-time chat, for v1).
- Personalized recommendations / ML-driven search ranking.
- Coupons/discount codes and promotional campaigns (flagged as a likely fast-follow, not v1).
- Multi-language / multi-currency (Romanian market, RON only, for v1).
