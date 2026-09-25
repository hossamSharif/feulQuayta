# Fuel-Quota and Post-Pay Billing Management System - Quick Start Guide

## Test Scenarios for Each User Story

### User Story 1: Client Lookup and Quota Check

**Setup**: Ensure you have at least one client with a vehicle and configured quotas in the database.

**Test Steps**:
1. Navigate to `/station`
2. Enter a valid vehicle plate number (e.g., "ABC123")
3. Click "Search"
4. Verify client name, contact info, quota balances by fuel type, and outstanding balance are displayed
5. Enter an invalid plate number and verify "No client found" message appears

**Expected Results**:
- Client lookup completes in under 30 seconds
- Quota balances are displayed correctly for all configured fuel types
- Invalid plate numbers return appropriate error message

### User Story 2: Fill-up Recording within Quota

**Setup**: Ensure client has available quota for testing.

**Test Steps**:
1. Look up a client via plate number
2. Select a fuel type and enter liters within remaining quota
3. Enter current price per liter
4. Click "Record Fill-up"
5. Verify transaction is recorded and quota balance is reduced appropriately
6. Verify no overage request was created

**Test Steps (Overage Scenario)**:
1. Look up a client with low or zero quota
2. Enter liters that exceed remaining quota
3. Click "Record Fill-up"
4. Verify transaction is recorded but marked as overage
5. Verify overage request was created in pending status
6. Verify transaction details (station, client, vehicle, fuel type, liters, price, timestamp) are recorded

**Test Steps (Offline Scenario)**:
1. Disconnect network connection
2. Look up a single-station client (should show cached data)
3. Record a fill-up (should show queued status)
4. Reconnect network
5. Verify fill-up is synced to server when connection restored

**Expected Results**:
- Fill-up recording completes in under 30 seconds
- Within-quota transactions reduce remaining quota appropriately
- Overage transactions create pending approval requests
- Offline fill-ups are queued and synced when connection returns
- Transaction details are accurately recorded with correct pricing

### User Story 3: Admin Overage Request Management

**Setup**: Ensure there are pending overage requests in the system.

**Test Steps**:
1. Navigate to `/admin/overages`
2. Locate a pending overage request
3. Click "Approve" on the request
4. Verify request status changes to approved
5. Verify client's outstanding balance increased by overage amount
6. Verify audit log entry was created

**Test Steps (Rejection)**:
1. Locate a pending overage request
2. Click "Reject" on the request
3. Verify request status changes to rejected
4. Verify client's outstanding balance remains unchanged
5. Verify audit log entry was created

**Expected Results**:
- Approved overage requests increase client outstanding balance
- Rejected overage requests do not affect client balance
- Approval/rejection completes in under 24 hours during business days
- Audit logs capture all approve/reject actions

### User Story 4: Payment Recording

**Setup**: Ensure client has outstanding balance to test against.

**Test Steps**:
1. Navigate to `/admin/payments`
2. Enter client ID
3. Enter payment amount less than outstanding balance
4. Select payment method
5. Click "Record Payment"
6. Verify outstanding balance reduced by payment amount
7. Verify payment recorded in payment history

**Test Steps (Overpayment)**:
1. Enter client ID
2. Enter payment amount greater than outstanding balance
3. Select payment method
4. Click "Record Payment"
5. Verify outstanding balance set to zero
6. Verify excess amount applied as credit balance
7. Verify payment recorded with credit indication

**Expected Results**:
- Payments reduce outstanding balance accurately
- Overpayments create credit balance on client account
- Payment posting completes with zero reconciliation discrepancies
- All payment methods (cash, card, digital wallet, bank transfer) supported

### User Story 5: Quota Reset

**Setup**: Ensure clients have used some of their quota and/or have credit balances.

**Test Steps**:
1. Navigate to `/admin/quota-reset`
2. Click "Reset All Quotas"
3. Verify all client quotas reset to configured allotment
4. Verify credit balances applied to outstanding balances
5. Verify audit trail of reset operation

**Expected Results**:
- Quota reset occurs automatically at period start
- No rollover of unused quota to next period
- Credit balances applied automatically at period start
- Reset process logs operational metrics

### User Story 6: Cross-Station Reporting

**Setup**: Ensure multiple stations have recorded transactions.

**Test Steps**:
1. Navigate to `/admin/reports`
2. Select date range (last 30 days recommended)
3. Optionally filter by specific station
4. Click "Generate Report"
5. Verify report shows aggregated data across all stations
6. Verify breakdown by fuel type and by station is accurate
7. Verify revenue, fill-up volume, and overage rate calculations

**Expected Results**:
- Reports generate accurately within 5 seconds for 90-day date ranges
- Data aggregates correctly from all stations
- Date and station filters work properly
- Export functionality (if implemented) produces valid CSV

## System Validation

### Performance Benchmarks
- Client lookup + fill-up recording: < 30 seconds for 95% of transactions
- Report generation: < 5 seconds for date ranges up to 90 days
- System uptime: 99.9% during business hours
- Audit log completeness: 99.9% for critical operations within 1 second

### Data Accuracy
- 99% of fill-up transactions accurately recorded with correct fuel type, volume, pricing, and quota status
- Quota reset accuracy: 100% across all clients and fuel types
- Payment posting accuracy: zero reconciliation discrepancies

### Concurrent Operations
- Support concurrent fill-up recording at multiple stations without data conflicts
- Handle network connectivity loss gracefully for single-station clients
- Prevent double-deduction under concurrent fill-up scenarios

## Troubleshooting

### Common Issues
1. **Client not found**: Verify vehicle plate is correctly formatted and exists in database
2. **Quota not updating**: Check that client has active quota for current period
3. **Offline sync failing**: Ensure network connection restored and service worker registered
4. **Overage not creating**: Verify fill-up amount actually exceeds remaining quota
5. **Payment not applying**: Verify client ID is correct and sufficient balance exists

### Logs and Monitoring
- Check browser console for frontend errors
- Review Supabase logs for backend errors
- Monitor audit logs for operational tracking
- Check metrics/events table for operational data

## Configuration

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server-only)
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN for error monitoring (optional)

### Feature Flags
- Offline capability: Enabled for single-station clients only
- PWA features: Service worker enabled in production
- Error reporting: Sentry enabled in production
- Analytics: Operational metrics collection enabled

## Deployment Notes

This system is designed for deployment on:
- Cloudflare Pages or Netlify (avoid Vercel Hobby tier due to commercial use restrictions)
- Requires Supabase project with the schema and functions applied
- Environment variables must be configured in deployment platform