# Performance Requirements

Only fill in numbers you actually care about. A vague "should be fast" gives Claude nothing to
design against — a target latency or load figure does. Leave `[TODO]` rather than guessing.

## Response Time Targets

| Operation | Target (p50) | Target (p95) | Notes |
|---|---|---|---|
| Page load / initial render | 1.5s | 3s | Product listing/search pages, measured on a typical broadband/mobile connection |
| API read (simple) | 100ms | 400ms | e.g. fetch product detail, category list, cart contents |
| API write | 200ms | 600ms | e.g. add to cart, update product, create address |
| Checkout (create order + Stripe PaymentIntent) | 500ms | 1.5s | Involves DB writes + a Stripe API round-trip; async payout/notification work happens after, not inline |
| Product search/filter | 200ms | 800ms | Category + keyword + price-range filtering; index accordingly (see below) |

## Scale Expectations

- Expected concurrent users at launch / at 1 year: low hundreds at launch, growing to roughly
  1,000-2,000 concurrent at the 1-year mark if growth goes well — small-launch profile, not
  designing for viral-scale spikes on day one.
- Expected data volume (rows in largest tables, growth rate): `Product` and `OrderItem`/`Order`
  are the fastest-growing tables — expect low thousands of products at launch growing to
  tens-of-thousands within a year as sellers onboard; orders growing roughly in proportion to
  buyer activity, likely thousands-to-low-tens-of-thousands of rows in year one. `AuditLog` and
  `TicketMessage` grow steadily but stay much smaller.
- Read/write ratio, if lopsided: heavily read-skewed — browsing/search/product-page views vastly
  outnumber writes (cart updates, orders, reviews). Optimize reads (catalog, search) first.
- Any known spiky load pattern (batch jobs, end-of-month, etc.): promotional spikes are likely
  once marketing starts (flash sales, seasonal campaigns like Black Friday, which is a big event
  for emag.ro specifically) — not a v1 launch concern, but worth keeping in mind when choosing
  caching/indexing strategy so it isn't a rewrite later. Payout jobs (see data-model.md `Payout`)
  run on a schedule (e.g. weekly), not buyer-facing, so their load can be off-peak.

## Constraints This Implies

- Pagination required on: product listing/search results, a seller's product list, a buyer's
  order history, a seller's order queue, admin seller-approval queue, support ticket queue,
  reviews list on a product page, audit log.
- Caching needed on: category tree (changes rarely, read constantly), product listing/search
  results (short TTL, since stock/price can change), product detail pages. Cart, order status,
  and anything payment-related should never be served stale/cached.
- Background/async processing needed for: Stripe webhook handling (payment confirmation status
  updates), seller payout batch job, order confirmation/status-change emails, review moderation
  notifications, avg_rating/review_count recomputation on Product after a Review changes. None of
  these should block the request that triggered them (e.g. checkout shouldn't wait on an email
  send).
- Database indexing priorities: `Product` on (category_id, is_active), plus a search index
  (Postgres full-text search or a dedicated search index later if full-text isn't enough) on
  title/description; `OrderItem` on seller_id (Seller's order queue is the highest-frequency
  Seller-side query); `Order` on buyer_id; `Review` on product_id; `SupportTicket` on
  (assigned_agent_id, status); `AuditLog` on (target_type, target_id) for lookup during disputes.
