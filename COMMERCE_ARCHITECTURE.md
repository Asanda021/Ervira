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
