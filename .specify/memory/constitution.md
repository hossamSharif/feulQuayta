<!-- Sync Impact Report v1.0.0
- Version change: (none — initial constitution) → 1.0.0
- Modified principles: N/A (initial version)
- Added sections: Core Principles (12), Technology & Architecture Standards, Development Workflow, Governance
- Removed sections: N/A
- Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ updated (Constitution Check gates aligned)
  - .specify/templates/spec-template.md — ✅ updated (Functional Requirements aligned)
  - .specify/templates/tasks-template.md — ✅ updated (task categorization aligned)
  - .specify/templates/checklist-template.md — ✅ no changes needed
- Follow-up TODOs:
  - RATIFICATION_DATE: true original adoption date not yet established — marked TODO below
  - GUIDANCE_FILE: docs/ directory has no quickstart.md or runtime guidance file yet
-->

# Qadra Oil Constitution

## Core Principles

### I. Transactional Data Integrity via Postgres RPC

Every operation that changes a client's fuel quota or payment balance (fill-up
recording, quota reset, overage approval, payment recording) MUST be
implemented as a Postgres function (RPC) executed inside a transaction with
row-level locking — never as a sequence of separate client-side reads/writes.
This prevents race conditions when multiple stations or pumps touch the same
client concurrently.

**Rationale**: Financial and quota data is the core of this system. Without
atomicity, two concurrent fill-ups at different pumps could both read the same
quota balance and both succeed, over-drafting the client's allowance. Server-side
RPCs with `SELECT ... FOR UPDATE` guarantee serializable isolation.

### II. Fixed-Precision Numeric Types for Financial & Fuel Math

All money and fuel-volume math uses fixed-precision `numeric` types in Postgres
(never floating point), consistent with append-only ledger principles.

**Rationale**: Floating-point arithmetic introduces rounding errors that compound
across thousands of transactions, leading to billing discrepancies. PostgreSQL's
`numeric(p, s)` type provides exact decimal arithmetic suitable for financial
systems.

### III. Append-Only Audit Log

Every quota-affecting and payment-affecting transaction is written to an
append-only audit log (transactions table with no `UPDATE`/`DELETE` allowed at
the application layer). Corrections happen via new offsetting entries, never by
editing history.

**Rationale**: Immutable transaction history is a regulatory requirement for
financial systems and enables full auditability. Any balance adjustment is
represented as a new ledger entry, preserving the original record and making
the chain of custody transparent.

### IV. Row-Level Security with Role-Based Access

Row Level Security enforces role-based data access: Admin role sees all stations;
Station User role is scoped to their assigned station_id only via a profiles
table (not user metadata). Client-touching business logic is still enforced in
RPC functions, not just RLS.

**Rationale**: RLS provides a defense-in-depth layer so even direct SQL access
through the Supabase client respects tenant boundaries. However, RLS alone
cannot enforce business invariants; the RPC layer enforces the actual rules.

### V. Supabase MCP for Schema & Migration Work

All Supabase schema, migrations, and query work must go through the Supabase MCP
plugin — no hand-written SQL scripts run outside of it.

**Rationale**: The MCP plugin ensures that all schema changes are tracked,
consistent, and executed through a managed interface, reducing the risk of
drift between local and remote environments.

### VI. shadcn/ui with Deliberate Visual Design

All UI is built with shadcn/ui components. The implementation must use
frontend design skills to produce a deliberate, non-templated visual design —
not default shadcn styling as-is. All screens must be fully responsive.

**Rationale**: Default shadcn styling produces generic-looking interfaces that
do not serve the brand or user context. A deliberate, intentional design ensures
the application feels purpose-built for oil-station operators and reflects
professional quality.

### VII. Offline-First PWA for Single-Station Clients

The Station User interface is a Progressive Web App with offline tolerance: it
must remain usable for plate lookup and fill-up recording when the device has
no connectivity, queuing writes locally (IndexedDB) and syncing them to
Supabase when connectivity returns. Any offline-recorded fill-up that would
exceed a client's quota once synced is automatically routed into the same
admin-approval queue used for live overages — never silently accepted or
silently rejected.

**Rationale**: Fuel stations may experience intermittent connectivity. Operators
must never be blocked from recording fuel dispensed. The offline queue must
preserve data integrity by routing overages through the same approval flow
used for online transactions.

### VIII. Online-Only Fill-ups for Network-Wide Clients

Network-wide clients (clients whose quota is usable at any station) do not get
offline-tolerant fill-up completion. The UI may show their last-known cached
balance while offline, but committing a fill-up for them requires an active
connection. Single-station clients are the ones offline tolerance applies to.

**Rationale**: A network-wide client's quota can be consumed at any station.
Allowing offline fill-ups for them would risk accepting a transaction that
exceeds a quota already consumed elsewhere while offline. Requiring online
connection ensures the quota check is authoritative.

### IX. Bilingual UI with RTL/LTR Support

The app is fully bilingual (Arabic, English). Arabic is the default locale and
renders right-to-left (RTL); English is a toggle and renders left-to-right
(LTR). Tailwind logical properties (`ps-`/`pe-`/`start-`/`end-`) must be used
throughout, not directional ones (`pl-`/`pr-`/`left-`/`right-`), so layouts
flip correctly. Every shadcn/ui component used must render correctly in RTL.

**Rationale**: Arabic-speaking operators are the primary user base, and the
interface must read naturally in their script direction. Logical properties
ensure that language toggling does not break layout geometry.

### X. Light & Dark Theme Support

Light and dark mode are both fully supported via `next-themes`, with a manual
toggle defaulting to system preference. Contrast and legibility must be
verified in both modes, particularly for the Station User screen, which may be
used outdoors in daylight or in low light at night.

**Rationale**: Station users operate in varied lighting conditions. Outdoor
daylight favors a light theme; night shifts favor dark. The toggle must not
degrade readability in either mode.

### XI. Git Commit After Each Task

Git commit after each completed implementation task.

**Rationale**: Granular commits enable precise rollbacks, clear history
tracking, and align with the project's speckit-based workflow where each phase
of work is committed in isolation.

### XII. Playwright E2E Coverage for Financial Flows

Playwright is used for end-to-end test coverage of the fill-up recording and
overage-approval flows specifically, since these carry financial risk.

**Rationale**: The fill-up and overage-approval flows are the highest-risk
paths in the system — they directly affect client balances and billing.
End-to-end tests through the real UI catch integration regressions that unit
tests cannot.

## Technology & Architecture Standards

### Stack

- **Frontend**: Next.js (App Router) with shadcn/ui, Tailwind CSS,
  next-themes for theming, i18next or next-intl for localization.
- **Backend**: Next.js Route Handlers / Server Actions calling Supabase.
- **Database**: Supabase Postgres — all data logic in Postgres functions.
- **Offline**: Service Worker + IndexedDB for PWA offline queue.
- **Testing**: Playwright for E2E (financial flows), Jest/React Testing
  Library for unit tests.
- **Auth**: Supabase Auth (admin and station-user roles via profiles table).

### Data Model Constraints

- All monetary values stored as `numeric(13, 4)` or equivalent fixed precision.
- All fuel volumes stored as `numeric(10, 3)`.
- No `UPDATE` or `DELETE` on the `transactions` audit table — corrections
  only via new offsetting entries.
- Quota resets are period-based (weekly/monthly/custom) — unused quota
  does not roll over.

## Development Workflow

### Task Discipline

- Follow the speckit workflow: specify → plan → tasks → implement.
- Commit after each completed task or logical group
  (`/speckit-git-commit` command).
- Use feature branches with sequential numbering
  (`/speckit-git-feature` command).

### Testing Discipline

- Financial-flow E2E tests (fill-up recording, overage approval) MUST be
  written in Playwright and MUST pass before merge.
- Unit tests cover non-financial UI logic and utility functions.
- Contract tests verify API/RPC boundaries where applicable.

### Code Review Standards

- All PRs must reference the principle it satisfies (e.g., "PRINCIPLE_III:
  Append-Only Audit Log").
- Complexity must be justified and documented in the plan's Complexity
  Tracking section.

## Governance

This constitution supersedes all other practices documented in the repository.
Amendments require documentation of the change, a migration path for existing
data or code affected, and a version increment.

### Amendment Procedure

1. Propose a change by creating a feature branch.
2. Update the constitution in `.specify/memory/constitution.md`.
3. Validate that all dependent templates (plan, spec, tasks, checklist)
   and any referenced guidance files are updated for consistency.
4. Run `/speckit-analyze` to verify cross-artifact consistency.
5. Merge only after review confirms the change aligns with the amendment
   procedure.

### Versioning Policy

- **MAJOR**: Backward-incompatible governance or principle removals/redefinitions.
- **MINOR**: New principle or section added, or material expansion of
  existing guidance.
- **PATCH**: Clarifications, wording adjustments, typo fixes, non-semantic
  refinements.

### Compliance Review

All PRs and reviews MUST verify compliance with the principles above. Any
deviation must be explicitly justified and documented in the plan's
Complexity Tracking section. Runtime development guidance lives in
[TODO(GUIDANCE_FILE): no docs/quickstart.md exists yet — create one for
runtime development instructions].

---

**Version**: 1.0.0 | **Ratified**: [TODO(RATIFICATION_DATE): original
adoption date not yet established — this is the initial constitution] |
**Last Amended**: 2026-09-20
