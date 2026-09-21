
This project is a fuel-quota and billing system for an oil company running
multiple fuel stations, built with Next.js and Supabase (no separate Node/
Express backend — server-side logic lives in Next.js Route Handlers/Server
Actions calling Supabase Postgres functions).

Non-negotiable engineering principles:
1. Every operation that changes a client's fuel quota or payment balance
   (fill-up recording, quota reset, overage approval, payment recording)
   MUST be implemented as a Postgres function (RPC) executed inside a
   transaction with row-level locking — never as a sequence of separate
   client-side reads/writes. This prevents race conditions when multiple
   stations or pumps touch the same client concurrently.
2. All money and fuel-volume math uses fixed-precision numeric types in
   Postgres (never floating point), consistent with append-only ledger
   principles.
3. Every quota-affecting and payment-affecting transaction is written to an
   append-only audit log (transactions table with no UPDATE/DELETE allowed
   at the application layer) — corrections happen via new offsetting
   entries, never by editing history.
4. Row Level Security enforces role-based data access: Admin role sees all
   stations; Station User role is scoped to their assigned station_id only
   via a profiles table (not user metadata). Client-touching business logic
   is still enforced in RPC functions, not just RLS.
5. All Supabase schema, migrations, and query work must go through the
   Supabase MCP — no hand-written SQL scripts run outside of it.
6. All UI is built with shadcn/ui components. The agent must use its
   frontend-design skill/capabilities to produce a deliberate, non-templated
   visual design — not default shadcn styling as-is. All screens must be
   fully responsive.
7. The Station User interface is a PWA with offline tolerance: it must
   remain usable for plate lookup and fill-up recording when the device
   has no connectivity, queuing writes locally (IndexedDB) and syncing them
   to Supabase when connectivity returns. Any offline-recorded fill-up that
   would exceed a client's quota once synced is automatically routed into
   the same admin-approval queue used for live overages — never silently
   accepted or silently rejected.
8. Network-wide clients (clients whose quota is usable at any station) do
   not get offline-tolerant fill-up completion — the UI may show their
   last-known cached balance while offline, but committing a fill-up for
   them requires an active connection. Single-station clients are the ones
   offline tolerance applies to.
9. Git commit after each completed implementation task.
10. Use Playwright for end-to-end test coverage of the fill-up recording
    and overage-approval flows specifically, since these carry financial
    risk.

11. The app is fully bilingual (Arabic, English). Arabic is the default
    locale and renders RTL; English is a toggle and renders LTR. Use
    Tailwind logical properties (ps-/pe-/start-/end-) throughout, not
    directional ones (pl-/pr-/left-/right-), so layouts flip correctly.
    Verify every shadcn/ui component used renders correctly in RTL.
12. Light and dark mode are both fully supported via next-themes, with a
    manual toggle defaulting to system preference. Contrast and legibility
    must be verified in both modes, particularly for the Station User
    screen, which may be used outdoors in daylight or in low light at
    night.