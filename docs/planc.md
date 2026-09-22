/speckit.plan
Tech stack: Next.js (App Router) + Supabase (Postgres, Auth, Realtime).
No separate Node/Express backend — server-side logic lives entirely in
Next.js Route Handlers / Server Actions, which call Postgres RPC functions
via the Supabase service role key. Client components never write directly
to tables that affect quota or payment state; they only read via RLS-scoped
queries or call the RPC endpoints.

Data layer:
- All quota-affecting operations (fill-up recording, overage approval,
  payment recording, credit application, quota reset) are Postgres
  functions (RPC), executed in a transaction with row-level locking
  (SELECT ... FOR UPDATE on the client's quota/balance row) to satisfy
  FR-013's no-double-deduction requirement under concurrent fill-ups.
- Money and liter fields use fixed-precision numeric types, never float.
- Fill-up Transactions and Payments are append-only audit tables — no
  UPDATE/DELETE at the application layer; corrections are offsetting
  entries.
- Client table includes both outstanding_balance and credit_balance
  (FR-014); credit_balance is applied automatically at the start of the
  client's next period via the same RPC that performs quota reset.
- Fill-up Transactions reference vehicle_id (foreign key), not the plate
  string, so vehicle plate corrections never affect historical records.
- profiles table (linked to Supabase Auth) carries role (admin/station_user)
  and station_id, used both by RLS policies and by RPC functions for
  authorization checks.
- All schema, migrations, and RLS policies are created and modified via the
  Supabase MCP exclusively.

Offline / PWA:
- Station User screen is a PWA (web app manifest + service worker via
  next-pwa or manual implementation).
- Offline data layer: IndexedDB via Dexie.js, storing a read-only cached
  snapshot of the station's single-station clients, their vehicles, and
  current quota/balance, refreshed whenever online.
- Writes made offline (fill-up recordings for single-station clients only)
  are queued locally and flushed to the fill-up RPC when connectivity
  returns; each queued write is idempotent (client-generated UUID) to
  avoid duplicate submission on retry.
- Any offline-recorded fill-up that, once synced and evaluated against the
  live server-side quota, would exceed the client's remaining balance is
  routed into the same Overage Request flow as a live overage — never
  silently accepted or rejected.
- Network-wide clients are excluded from offline write capability per
  FR-003: their cached balance may be displayed while offline, but the
  fill-up RPC for them requires an active connection and is disabled in
  the UI when offline.

UI:
- shadcn/ui component library throughout; apply frontend-design skill for
  a deliberate, non-templated visual design rather than default styling.
- Fully responsive; Station User screen specifically optimized for
  one-handed, high-contrast, few-tap use on a phone or basic tablet at
  the pump.
- Bilingual: Arabic (default, RTL) and English (LTR) via next-intl or
  equivalent; Tailwind logical properties (ps-/pe-/start-/end-) used
  throughout, never directional (pl-/pr-/left-/right-), so RTL layout is
  correct by construction rather than patched in later.
- Light/dark theme via next-themes, defaulting to system preference,
  with particular attention to outdoor daylight and low-light legibility
  on the Station User screen.

Observability (per clarification: operational metrics + error logging):
- Error logging and alerting via Sentry (or equivalent) for both client
  and server-side errors.
- Operational metrics (fill-up volume, overage rate, sync failures) logged
  to a dedicated metrics/events table queryable by Admin reporting, rather
  than a separate external analytics platform, to keep the stack minimal.

Testing:
- Playwright end-to-end tests specifically covering: fill-up recording
  (within-quota and overage paths), overage approval/rejection, offline
  queuing and sync/reconciliation, and payment recording including the
  overpayment-to-credit path.

Deployment:
- Deploy via Cloudflare Pages or Netlify rather than Vercel's free Hobby
  tier, since that tier's terms of service prohibit commercial use.

Scale target (per clarification): dozens of stations, hundreds of clients,
thousands of fill-up transactions per day — plate-number lookups and
per-client transaction history must be indexed accordingly (unique index
on vehicle.plate, index on fill-up transactions by client_id and by
station_id + created_at).