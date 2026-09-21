
Build a fuel-quota and post-pay billing management system for an oil
company that operates multiple fuel stations.

Roles:
- Admin: creates and manages stations, creates and manages station-user
  accounts, manages clients and their quota assignments, approves or
  rejects overage requests, records payments received against a client's
  outstanding balance, views cross-station reports.
- Station User: scoped to one assigned station. Looks up a client by
  vehicle plate number to see their current quota balance and outstanding
  payment status, records a fill-up transaction against a client's quota,
  and can view their own station's client list.

Core entities:
- Station (name, location, assigned station users)
- Client (name, contact info, one or more linked Vehicles, quota
  configuration)
- Vehicle (plate number, linked to one Client)
- Quota: per Client, defined separately per fuel type (petrol/diesel),
  amount in liters, a period_type (weekly/monthly/custom) with
  period_start/period_end, and a quota_scope of either "single_station"
  (tied to one home Station) or "network_wide" (usable at any Station).
  Quota does not roll over — it resets to the client's allotted amount at
  the start of each new period.
- Fill-up Transaction: records station, client, vehicle, fuel type, liters
  dispensed, price at time of fill-up, timestamp, and whether it was within
  quota or flagged as an overage.
- Overage Request: created automatically when a fill-up would exceed a
  client's remaining quota for the period. Status is pending/approved/
  rejected. The fill-up is recorded and fuel is considered dispensed
  regardless of outcome — approval/rejection affects billing status, not
  fuel delivery, since fuel cannot be un-dispensed.
- Payment: records amount, date, and method against a client's outstanding
  post-pay balance. Partial payments are allowed. Client balance is the
  running total of billable fill-ups minus recorded payments.
- Price: fuel price per liter per fuel type, versioned by effective date so
  historical transactions retain the price that applied when they occurred.

Key workflows:
1. Admin creates a station and invites/creates a station-user account
   scoped to it.
2. Admin creates a client, assigns their quota (per fuel type, period,
   and scope), and links one or more vehicles to them.
3. Station User searches by plate number and sees: client name, remaining
   quota by fuel type for the current period, and outstanding payment
   balance.
4. Station User records a fill-up. If within quota, it completes
   immediately. If it would exceed quota, it still completes (fuel is
   dispensed) but creates a pending Overage Request for Admin review.
5. Admin reviews pending overage requests and approves or rejects them,
   which affects the client's billed amount and outstanding balance.
6. Admin records payments against a client's outstanding balance as they
   come in.
7. At the start of each new period, each client's quota resets to their
   configured allotment (no rollover of unused quota).

Offline behavior (Station User screen only):
- For single-station clients, plate lookup and fill-up recording must work
  fully offline, with fill-ups queued locally and synced to Supabase when
  connectivity returns. If a synced fill-up turns out to exceed quota
  (e.g., quota changed while offline), it's routed to the overage-approval
  queue rather than rejected outright.
- For network-wide clients, the last-known cached balance may be shown
  while offline, but recording a fill-up for them requires an active
  connection, since their quota can be affected by other stations.

Explicitly out of scope for this version: no client-facing login/portal —
all lookups are performed by station staff only.

All screens support a language toggle (Arabic default, English secondary)
and a light/dark theme toggle (default: follow system preference). Fuel
type names, station names, and all user-facing labels/messages must exist
in both languages.