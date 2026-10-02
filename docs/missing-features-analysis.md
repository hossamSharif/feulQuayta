# Missing Features Analysis — Qadra Oil Fuel Quota & Billing

## Context

The user requested a guide to using the Qadra Oil app (admin + station user workflows). During analysis of the current implementation, several critical features are missing that prevent a complete user experience for both roles. This document documents the missing features so they can be prioritized and implemented.

## Current State

The app has:
- Home page with links to Station and Admin
- Station user dashboard: plate lookup, fill-up form, client detail, offline guard
- Admin dashboard: links to overages, payments, quota reset, reports, quotas
- Admin layout with sidebar navigation
- Auth infrastructure (supabase client/server, auth.ts, sessions.ts)
- RPC functions: lookup_client_by_plate, record_fillup, approve_overage, reject_overage, record_payment, reset_quota, get_cross_station_report
- RLS policies on all tables
- Offline support: Dexie.js store, sync service, write queue, cache
- Validation: fill-up form validation
- Translation infrastructure: messages/ar.json, messages/en.json

## Missing Features — Comprehensive List

### 🔐 Authentication & Authorization

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| A1 | **Login Page** | Critical | No login UI exists. Users cannot sign in to access the app. Needs email/password form with Supabase Auth integration. |
| A2 | **Logout Button** | Critical | No logout functionality. Users cannot end their session. |
| A3 | **Auth Middleware** | Critical | No middleware.ts to protect routes. Any user can access admin/station pages without authentication. |
| A4 | **Auth Context/Provider** | Critical | No auth state management (React Context or Zustand). Components cannot access current user/session. |
| A5 | **Role-Based Route Protection** | High | Admin and station user routes need protection based on user role in profiles table. |
| A6 | **Session Expiry Handling** | Medium | No automatic redirect to login on session expiry. |
| A7 | **Password Reset Flow** | Medium | No password reset page or email trigger. |

### 🏢 Station Management

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| S1 | **Station CRUD Page** | Critical | Admin cannot add/edit/delete stations. No page exists for station management. |
| S2 | **User-Station Assignment** | Critical | No UI to assign station users to stations. Profiles have station_id but no way to set it via UI. |
| S3 | **Station Selection** | High | Station users need to select their station if they have access to multiple stations. |

### 👤 User & Profile Management

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| U1 | **Profile Page** | High | Station users cannot view/edit their own profile (name, contact info). |
| U2 | **User Management Page** | High | Admin cannot view/list users or manage their roles. |
| U3 | **Role Assignment UI** | High | No UI to change a user's role (admin/station_user). |

### 👥 Client Management

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| C1 | **Client CRUD Page** | High | Admin cannot add/edit/delete clients. Only test data exists. |
| C2 | **Client Search** | Medium | Station user can only search by plate. No search by client name or contact info. |
| C3 | **Client Detail Page** | Medium | No dedicated client detail page showing full history, quotas, payments. |

### 🚗 Vehicle Management

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| V1 | **Vehicle Registration** | High | No UI to add vehicles to clients. Station user cannot register a new vehicle. |
| V2 | **Vehicle Assignment** | Medium | No way to link a vehicle to a client via UI. |

### ⛽ Fuel Type & Price Management

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| F1 | **Fuel Type Management** | Medium | No UI to add/edit fuel types. Currently hardcoded test data only. |
| F2 | **Price Management UI** | Medium | Price management component exists but may not be fully wired to CRUD operations. |

### 📋 Fill-Up & Transaction Features

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| T1 | **Fill-Up History** | High | Station user cannot view past fill-up transactions. No history page. |
| T2 | **Fill-Up Edit/Delete** | Medium | No ability to edit or delete incorrect fill-up records. |
| T3 | **Quota Alert/Notification** | High | No visual or audible alert when quota is low or exceeded. |
| T4 | **Draft Fill-Up Recovery** | Medium | No UI to view/resolve pending offline fill-up drafts. |

### 📊 Reporting & Analytics

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| R1 | **Audit Log Viewer** | Medium | No page for admin to view audit_logs table. Critical for compliance. |
| R2 | **Station-Level Reports** | Medium | Reports currently cross-station only. No station-specific report view. |
| R3 | **Real-Time Dashboard** | Medium | No real-time metrics dashboard (today's fill-ups, revenue, etc.). |

### ⚙️ Settings & Preferences

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| P1 | **Settings Page** | Low | No app settings page (branding, defaults, timezone, etc.). |
| P2 | **Language Switcher** | Medium | Translation files exist (ar/en) but no UI to switch languages. |
| P3 | **Theme Toggle** | Medium | No dark/light mode toggle in UI. |

### 🔔 Notifications & Alerts

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| N1 | **Quota Limit Warning** | High | No warning when remaining quota is below threshold (e.g., 20%). |
| N2 | **Overage Request Notification** | Medium | No notification to admin when new overage request is submitted. |
| N3 | **Payment Confirmation** | Medium | No confirmation message after payment recording. |

### 🔄 Offline & Sync

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| O1 | **Offline Status Indicator** | High | No visual indicator showing online/offline status in UI. |
| O2 | **Sync Status Panel** | Medium | No UI to view pending sync items or sync history. |
| O3 | **Conflict Resolution** | Low | No UI to resolve sync conflicts (same record edited offline and online). |

## Recommended Implementation Order

### Phase 1: Critical (blocks basic usage)
- A1 Login Page
- A2 Logout Button
- A3 Auth Middleware
- A4 Auth Context/Provider
- S1 Station CRUD Page
- S2 User-Station Assignment

### Phase 2: High Priority (completes core workflows)
- A5 Role-Based Route Protection
- V1 Vehicle Registration
- C1 Client CRUD Page
- T1 Fill-Up History
- N1 Quota Limit Warning
- O1 Offline Status Indicator

### Phase 3: Medium Priority (enhances UX)
- U1 Profile Page
- U2 User Management Page
- C2 Client Search
- F2 Price Management UI
- R1 Audit Log Viewer
- P2 Language Switcher
- N2 Overage Request Notification

### Phase 4: Low Priority (nice-to-have)
- A6 Session Expiry Handling
- A7 Password Reset Flow
- T2 Fill-Up Edit/Delete
- P1 Settings Page
- P3 Theme Toggle
- O2 Sync Status Panel
- O3 Conflict Resolution

## Verification

After implementing missing features:
1. ✅ Admin can log in, create stations, assign users to stations
2. ✅ Station user can log in, view profile, register vehicles, view fill-up history
3. ✅ Both roles see appropriate navigation based on their role
4. ✅ Route protection prevents unauthorized access
5. ✅ Offline indicator shows connection status
6. ✅ Quota warnings appear when quota is low
7. ✅ Audit logs are viewable by admin
8. ✅ Language can be switched between Arabic/English
