---

description: Task list for fuel-quota and post-pay billing management system

---

# Tasks: Fuel-Quota and Post-Pay Billing Management System

**Input**: Design documents from `/specs/001-fuel-quota-billing/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web application**: `app/` (Next.js App Router), `components/`, `lib/`, `supabase/`
- All schema, migrations, and RLS policies are created and modified via the Supabase MCP exclusively.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js project with TypeScript at repository root (`app/`, `components/`, `lib/`)
- [ ] T002 [P] Initialize Supabase project and wire up client (`supabase/client.ts`, `supabase/server.ts`)
- [ ] T003 [P] Configure TypeScript, ESLint, Prettier, and Tailwind CSS with shadcn/ui (`tsconfig.json`, `.eslintrc.json`, `tailwind.config.js`, `lib/shadcn.json`)
- [ ] T004 [P] Install runtime dependencies: next-intl, next-themes, dexie, @supabase/supabase-js (`package.json`)
- [ ] T005 [P] Create `.env.local` with Supabase URL, anon key, and service role key placeholders

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create Supabase database schema: stations, profiles, clients, vehicles, fuel_types, quotas, prices, fill_up_transactions, overage_requests, payments, audit_logs (`supabase/migrations/XXX_initial_schema.sql`)
- [ ] T007 [P] Create database indexes: unique index on vehicle.plate, index on fill_up_transactions by client_id and by station_id + created_at (`supabase/migrations/XXX_indexes.sql`)
- [ ] T008 Configure Supabase Auth and Row-Level Security (RLS) policies for admin vs station_user roles (`supabase/migrations/XXX_auth_rls.sql`)
- [ ] T010 [P] Implement server-side RPC functions for quota-affecting operations: `record_fillup`, `approve_overage`, `record_payment`, `reset_quota`, `apply_credit` (`supabase/migrations/XXX_rpc_functions.sql`)
- [ ] T011 Create base types and utilities: Supabase client wrapper, auth helpers, error logger (`lib/supabase.ts`, `lib/auth.ts`, `lib/logger.ts`)
- [ ] T012 [P] Implement Sentry error logging for client and server-side errors (`lib/sentry.client.ts`, `lib/sentry.server.ts`)
- [ ] T013 Create shadcn/ui base layout, theme provider, and language provider (`components/ui/`, `lib/intl.ts`, `lib/theme-provider.tsx`)
- [ ] T014 Setup PWA configuration with service worker (`next.config.mjs`, `public/manifest.json`)
- [ ] T015 [P] Create Dexie.js offline store wrapper and sync service (`lib/offline-store.ts`, `lib/sync-service.ts`)
- [ ] T016 Setup Playwright test infrastructure and config (`e2e/`, `playwright.config.ts`)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Client Lookup and Quota Check (Priority: P1) 🎯 MVP

**Goal**: Station User looks up a client by vehicle plate number to see their current quota balance and outstanding payment status.

**Independent Test**: Can be fully tested by verifying that entering a valid plate number displays correct client name, quota balances by fuel type for current period, and outstanding payment balance.

**Note**: Tests are included here since the plan explicitly calls for Playwright E2E tests covering this workflow.

### Tests for User Story 1

- [ ] T017 [P] [US1] Write Playwright E2E test: client lookup by plate returns quota and balance (`e2e/us1-client-lookup.spec.ts`)

### Implementation for User Story 1

- [ ] T018 [US1] Create station user dashboard layout with plate number input (`app/station/page.tsx`, `components/station/plate-input.tsx`)
- [ ] T019 [P] [US1] Implement plate number lookup RPC: `lookup_client_by_plate(plate)` returns client, vehicle, quota balances, outstanding balance (`supabase/migrations/XXX_lookup_rpc.sql`)
- [ ] T020 [P] [US1] Create client detail view showing quota by fuel type and payment status (`components/station/client-detail.tsx`)
- [ ] T021 [P] [US1] Add RTL/LTR text direction support for station user screen (`lib/intl.ts`)
- [ ] T022 [US1] Implement service worker caching of station's client/vehicle/quota snapshot for offline display (`lib/offline-cache.ts`)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Fill-up Recording within Quota (Priority: P1)

**Goal**: Station User records a fill-up transaction against a client's quota, dispensing fuel regardless of quota status but creating overage requests when applicable. Also handles offline recording for single-station clients.

**Independent Test**: Can be fully tested by verifying that recording a fill-up within quota updates the client's remaining quota, creates a transaction record, and does not create an overage request; and that offline-queue + sync reconciliation respects live quota.

### Tests for User Story 2

- [ ] T023 [P] [US2] Write Playwright E2E test: fill-up within quota reduces quota, no overage (`e2e/us2-fillup-within-quota.spec.ts`)
- [ ] T024 [P] [US2] Write Playwright E2E test: fill-up exceeding quota creates overage request (`e2e/us2-fillup-overage.spec.ts`)
- [ ] T025 [P] [US2] Write Playwright E2E test: offline fill-up queued and synced/reconciled on reconnect (`e2e/us2-offline-queue.spec.ts`)

### Implementation for User Story 2

- [ ] T026 [P] [US2] Create fill-up recording form component with fuel type selection and liters input (`components/station/fillup-form.tsx`)
- [ ] T027 [P] [US2] Implement fill-up form validation (zero/negative liters rejected, invalid plate handling) (`lib/validation/fillup.ts`)
- [ ] T028 [US2] Wire fill-up form to `record_fillup` RPC with idempotency key for retries (`app/station/actions.ts`)
- [ ] T029 [P] [US2] Implement offline queue: fill-up writes stored in Dexie.js with client UUID, flushed on reconnect (`lib/offline-write-queue.ts`)
- [ ] T030 [P] [US2] Implement network-wide client detection in UI: disable fill-up when offline for network-wide clients (`components/station/offline-guard.tsx`)
- [ ] T031 [US2] Add optimistic quota display update and reconciliation after server-side quota check (`hooks/use-quota-reconciliation.ts`)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Admin Overage Request Management (Priority: P2)

**Goal**: Admin reviews pending overage requests and approves or rejects them, affecting the client's billed amount and outstanding balance.

**Independent Test**: Can be fully tested by verifying that approved overage requests increase the client's billed amount and outstanding balance, while rejected requests do not.

### Tests for User Story 3

- [ ] T032 [P] [US3] Write Playwright E2E test: overage approval adds to client outstanding balance (`e2e/us3-overage-approval.spec.ts`)
- [ ] T033 [US3] Write Playwright E2E test: overage rejection does not affect balance (`e2e/us3-overage-rejection.spec.ts`)

### Implementation for User Story 3

- [ ] T034 [US3] Create admin layout with role-based navigation (`app/admin/layout.tsx`, `components/admin/sidebar.tsx`)
- [ ] T035 [P] [US3] Create overage request list view with filters (pending, approved, rejected) (`components/admin/overage-list.tsx`)
- [ ] T036 [US3] Implement `approve_overage` and `reject_overage` RPC functions with row-level locking (`supabase/migrations/XXX_overage_actions_rpc.sql`)
- [ ] T037 [US3] Create overage request detail view with approve/reject actions (`components/admin/overage-detail.tsx`)
- [ ] T038 [P] [US3] Add audit logging for overage approve/reject operations (`supabase/migrations/XXX_audit_triggers.sql`)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Payment Recording (Priority: P2)

**Goal**: Admin records payments received against a client's outstanding balance, allowing partial payments and overpayment-to-credit conversion.

**Independent Test**: Can be fully tested by verifying that recording a payment reduces the client's outstanding balance by the payment amount, and overpayment sets balance to zero and creates credit.

### Tests for User Story 4

- [ ] T039 [P] [US4] Write Playwright E2E test: payment reduces outstanding balance (`e2e/us4-payment-recording.spec.ts`)
- [ ] T040 [US4] Write Playwright E2E test: overpayment creates credit balance on client (`e2e/us4-overpayment-credit.spec.ts`)

### Implementation for User Story 4

- [ ] T041 [US4] Create payment recording form with method selection (cash, card, digital wallet, bank transfer) (`components/admin/payment-form.tsx`)
- [ ] T042 [US4] Implement `record_payment` RPC with overpayment-to-credit logic and row-level locking (`supabase/migrations/XXX_payment_rpc.sql`)
- [ ] T043 [US4] Create payment history view for a client (`components/admin/payment-history.tsx`)
- [ ] T044 [US4] Add audit logging for all payment recording operations (`lib/logger.ts`)

**Checkpoint**: At this point, User Stories 1-4 should all work independently

---

## Phase 7: User Story 5 - Quota Reset (Priority: P3)

**Goal**: At the start of each new period, each client's quota resets to their configured allotment with no rollover of unused quota; credit_balance is applied automatically.

**Independent Test**: Can be fully tested by verifying that at period start, quota resets to configured amount regardless of previous period's usage.

### Implementation for User Story 5

- [ ] T045 [US5] Implement `reset_quota` RPC function: resets all quotas to configured allotment, applies credit_balance to outstanding_balance (`supabase/migrations/XXX_reset_quota_rpc.sql`)
- [ ] T046 [US5] Create scheduled function (Supabase cron or scheduled job) to run `reset_quota` at period start (`supabase/migrations/XXX_quota_reset_schedule.sql`)
- [ ] T047 [US5] Create admin quota management UI: view/set client quota allotments by fuel type (`components/admin/quota-management.tsx`)
- [ ] T048 [US5] Add manual quota reset trigger in admin UI for fallback/administration (`app/admin/quota-reset/action.ts`)

**Checkpoint**: At this point, User Stories 1-5 should all work independently

---

## Phase 8: User Story 6 - Cross-Station Reporting (Priority: P3)

**Goal**: Admin views cross-station reports to monitor operations across all fuel stations, with date range and station filters.

**Independent Test**: Can be fully tested by verifying that reports aggregate data from all stations correctly.

### Implementation for User Story 6

- [ ] T049 [US6] Create reporting dashboard layout with date range and station filters (`app/admin/reports/page.tsx`)
- [ ] T050 [P] [US6] Implement `get_cross_station_report` RPC with filters for total fill-ups, fuel types, revenue, overage rate (`supabase/migrations/XXX_reports_rpc.sql`)
- [ ] T051 [P] [US6] Create report visualization components: revenue chart, fill-up volume chart, overage rate chart (`components/admin/report-charts.tsx`)
- [ ] T052 [US6] Log operational metrics to metrics/events table (fill-up volume, overage rate, sync failures) (`supabase/migrations/XXX_metrics_table.sql`)
- [ ] T053 [US6] Implement data export (CSV) for reports (`app/admin/reports/[reportId]/export/route.ts`)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T054 Create shared error boundary components for client and server (`components/error-boundary.tsx`)
- [ ] T055 [P] Implement Arabic (default, RTL) and English (LTR) translations for all user-facing strings (`messages/ar.json`, `messages/en.json`)
- [ ] T056 [P] Refine Station User screen for outdoor daylight and low-light legibility (`app/station/layout.tsx`, `styles/station-legibility.css`)
- [ ] T057 Implement historical fuel price management with effective dates (`components/admin/price-management.tsx`)
- [ ] T058 Add vehicle plate number unique validation at DB level (`supabase/migrations/XXX_vehicle_unique.sql`)
- [ ] T059 Implement price history reference for transactions (price locked at transaction time) (`supabase/migrations/XXX_price_history.sql`)
- [ ] T060 Create quickstart.md with test scenarios for each user story (`specs/001-fuel-quota-billing/quickstart.md`)
- [ ] T061 [P] Generate static sitemap and verify accessibility (WCAG contrast, keyboard nav) (`app/sitemap.ts`, Lighthouse audit)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4 → US5 → US6)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 client lookup for context, but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US2 overage creation, but independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members
- Translations, export, and accessibility tasks in Polish phase marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write Playwright E2E test: client lookup by plate returns quota and balance"

# Launch all models/RPCs for User Story 1 together:
Task: "Create station user dashboard layout with plate number input"
Task: "Implement plate number lookup RPC: lookup_client_by_plate(plate)"
Task: "Create client detail view showing quota by fuel type and payment status"

# Language support can be parallel with views:
Task: "Add RTL/LTR text direction support for station user screen"
Task: "Implement service worker caching of station's client/vehicle/quota snapshot for offline display"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 + 4 → Test independently → Deploy/Demo
5. Add User Story 5 → Test independently → Deploy/Demo
6. Add User Story 6 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Station User lookup + fill-up)
   - Developer B: User Story 3 + 4 (Admin overage + payments)
   - Developer C: User Story 5 + 6 (Reports + quota reset)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
