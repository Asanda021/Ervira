# ERVIRA — Commerce & License Architecture

## Current foundation

The Supabase project now contains the shared store foundation:
- 6 ERVIRA products
- 18 product plans (Starter / Professional / Team)
- 6 Academy catalog records
- profiles linked to Supabase Auth users
- orders
- licenses
- Row Level Security enabled on user-owned tables
- public read access limited to catalog tables

## Purchase flow

`ervira.ir`
→ product / plan selection
→ authenticated user
→ secure backend / Edge Function
→ create pending order
→ redirect to payment gateway
→ gateway callback to backend
→ verify transaction server-side
→ mark order paid
→ issue license
→ show license in dashboard

### Security rule

Payment credentials, gateway secrets, license signing secrets and service-role/secret Supabase keys must never be stored in:
- frontend JavaScript
- public GitHub
- browser localStorage
- public HTML

## Gateway adapter

The backend should use a provider adapter so ERVIRA can support:
- ZarinPal
- IDPay
- NextPay

The selected gateway is configuration, not frontend logic.

Required backend operations:
1. createPayment
2. verifyPayment
3. createLicense
4. revokeLicense
5. getOrderStatus

## License model

Starter:
- single-device / single-user model

Professional:
- single-user commercial model

Team:
- team-seat model

The exact device binding and seat limits are product-specific and should be enforced server-side.

## Dashboard

The dashboard already has the authentication gate. Project, order and license data should be loaded from Supabase only after the session is established.

Placeholder counts were removed so the UI does not pretend that fake projects/licenses/reports exist.

## Remaining production dependencies

These are intentionally not fabricated:
- Google OAuth credentials
- Apple Sign in credentials
- production SMTP
- payment gateway merchant credentials
- final license rules for each product
- production Edge Functions/backend

These should be connected at the final integration stage when the corresponding accounts and secrets are available.


## P133 — secure pending-order backend

The first production backend boundary is now active as Supabase Edge Function `create-pending-order` with JWT verification enabled. The public checkout sends only product/plan identifiers; the function authenticates the user, resolves the active product and plan from the database, reads the authoritative price server-side, reuses an existing pending order when available, and creates a new pending order otherwise. Payment secrets are not exposed to the browser.


## Payment Adapter Contract
Production payment integration is provider-neutral: create a payment attempt from the server-side order amount, store provider/reference, redirect to the gateway, and verify the callback on the server before marking an order paid. The frontend never marks an order paid. The callback endpoint currently fails closed until a real gateway is configured.

## P152 — Download Delivery
The customer download area is intentionally license-aware. Public product pages may describe products, but protected binaries must only be delivered after account authentication and license entitlement checks. Until official release artifacts are published, the store must not expose placeholder or fabricated download URLs.

## P156 — Download entitlement
Protected software delivery must be entitlement-based: authenticated user + active license + matching product/plan. Until release artifacts exist, the UI must not expose a download URL.

## P157 — Release artifact policy
Release artifacts must be published from a verified release pipeline and referenced by immutable version identifiers. No fabricated binary URL is allowed in production UI.

## P161 — Version entitlement
A customer entitlement maps a license to a product plan. Customer downloads must match the licensed product/plan and an explicitly published stable release. Never substitute another product or release.

## P166 — Release readiness gate
A version tag must pass repository metadata validation before production release. This gate does not publish binaries automatically; it only validates release prerequisites until official product artifacts are available.

## P179 — Production hardening checklist
Security and production checks: RLS enabled on private commerce data; payment verification server-side; license issuance server-side; frontend never sets paid status; secrets remain server-side; missing gateway/release artifacts fail closed; mobile and reduced-motion behavior must remain usable.

## P183–P189 Production gate
Payment provider activation requires a real merchant account and server-side secret configuration. The browser may only receive public configuration. Production activation requires create-payment, callback, server-side verification, paid transition, and license issuance smoke tests.