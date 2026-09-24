-- ============================================================
-- RPC FUNCTIONS — All quota-affecting operations
-- ============================================================

-- -----------------------------------------------------------
-- LOOKUP CLIENT BY PLATE
-- Returns client, vehicles, quotas, outstanding balance
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lookup_client_by_plate(p_plate text)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
    SELECT jsonb_build_object(
        'client', c,
        'vehicles', COALESCE((
            SELECT jsonb_agg(v)
            FROM public.vehicles v
            WHERE v.client_id = c.id
        ), '[]'::jsonb),
        'quotas', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'fuel_type', ft.name,
                'remaining_liters', q.remaining_liters,
                'amount_liters', q.amount_liters,
                'current_period_start', q.current_period_start,
                'current_period_end', q.current_period_end
            ))
            FROM public.quotas q
            JOIN public.fuel_types ft ON ft.id = q.fuel_type_id
            WHERE q.client_id = c.id
        ), '[]'::jsonb)
    )
    FROM public.clients c
    JOIN public.vehicles v ON v.client_id = c.id
    WHERE v.plate = lower(p_plate)
    LIMIT 1;
$$;

-- -----------------------------------------------------------
-- RECORD FILL-UP
-- Idempotent: p_idempotency_key must be unique per client
-- Row-level locking to prevent double-deduction under concurrency
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_fillup(
    p_station_id uuid,
    p_client_id uuid,
    p_vehicle_id uuid,
    p_fuel_type_id uuid,
    p_liters numeric,
    p_price_per_liter numeric,
    p_total_price numeric,
    p_idempotency_key uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quota record;
    v_remaining_after numeric;
    v_is_overage boolean;
    v_overage_amount numeric;
    v_transaction_id uuid;
    v_overage_id uuid;
    v_operator_id uuid;
BEGIN
    -- Idempotency check
    IF EXISTS (SELECT 1 FROM public.fill_up_transactions WHERE id = p_idempotency_key) THEN
        RETURN (SELECT jsonb_build_object('id', id, 'is_overage', is_overage) FROM public.fill_up_transactions WHERE id = p_idempotency_key);
    END IF;

    -- Validate station user is scoped to station
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.station_id = p_station_id
    ) THEN
        RAISE EXCEPTION 'Station user is not scoped to this station' USING ERRCODE = '42501';
    END IF;

    -- Get quota for current period with row-level locking
    SELECT q.*, ft.name AS fuel_name
    INTO v_quota
    FROM public.quotas q
    JOIN public.fuel_types ft ON ft.id = q.fuel_type_id
    WHERE q.client_id = p_client_id
      AND q.fuel_type_id = p_fuel_type_id
      AND q.current_period_start <= CURRENT_DATE
      AND q.current_period_end >= CURRENT_DATE
    FOR UPDATE;

    IF v_quota.id IS NULL THEN
        RAISE EXCEPTION 'No active quota found for client, fuel type, and period' USING ERRCODE = '20000';
    END IF;

    -- Check concurrent fill-up at another station
    IF EXISTS (
        SELECT 1 FROM public.fill_up_transactions t
        WHERE t.client_id = p_client_id
          AND t.fuel_type_id = p_fuel_type_id
          AND t.created_at >= v_quota.current_period_start
          AND t.created_at < v_quota.current_period_end
    ) THEN
        RAISE EXCEPTION 'Concurrent fill-up in progress for this client' USING ERRCODE = '40001';
    END IF;

    v_remaining_after := v_quota.remaining_liters - p_liters;
    v_is_overage := v_remaining_after < 0;
    v_overage_amount := CASE WHEN v_is_overage THEN abs(v_remaining_after) ELSE 0 END;

    -- Create fill-up transaction (append-only)
    INSERT INTO public.fill_up_transactions (
        station_id, client_id, vehicle_id, fuel_type_id,
        liters, price_per_liter, total_price, is_overage, overage_request_id
    ) VALUES (
        p_station_id, p_client_id, p_vehicle_id, p_fuel_type_id,
        p_liters, p_price_per_liter, p_total_price, v_is_overage, NULL
    )
    RETURNING id INTO v_transaction_id;

    -- Create overage request if exceeded
    IF v_is_overage THEN
        INSERT INTO public.overage_requests (
            fill_up_transaction_id, client_id, overage_amount, status
        ) VALUES (
            v_transaction_id, p_client_id, v_overage_amount, 'pending'
        )
        RETURNING id INTO v_overage_id;
    END IF;

    -- Update quota remaining amount
    UPDATE public.quotas
    SET remaining_liters = GREATEST(v_remaining_after, 0)
    WHERE id = v_quota.id;

    -- Log operational metrics
    INSERT INTO public.metrics_events (event_type, station_id, value, metadata)
    VALUES (
        'fillup', p_station_id, p_liters,
        jsonb_build_object('client_id', p_client_id, 'overage', v_is_overage)
    );

    v_operator_id := auth.uid();

    RETURN jsonb_build_object(
        'id', v_transaction_id,
        'is_overage', v_is_overage,
        'overage_request_id', v_overage_id,
        'remaining_liters', GREATEST(v_remaining_after, 0),
        'operator_id', v_operator_id
    );
END;
$$;

-- -----------------------------------------------------------
-- APPROVE OVERAGE REQUEST
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_overage(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request record;
    v_operator_id uuid;
BEGIN
    SELECT * INTO v_request FROM public.overage_requests WHERE id = p_request_id FOR UPDATE;
    IF v_request.id IS NULL THEN
        RAISE EXCEPTION 'Overage request not found' USING ERRCODE = '20000';
    END IF;
    IF v_request.status <> 'pending' THEN
        RAISE EXCEPTION 'Overage request is not pending' USING ERRCODE = '20000';
    END IF;

    v_operator_id := auth.uid();

    UPDATE public.overage_requests
    SET status = 'approved', reviewed_at = now(), reviewed_by = v_operator_id
    WHERE id = p_request_id;

    UPDATE public.clients
    SET outstanding_balance = outstanding_balance + v_request.overage_amount
    WHERE id = v_request.client_id;

    INSERT INTO public.metrics_events (event_type, value, metadata)
    VALUES ('overage_approved', v_request.overage_amount, jsonb_build_object('request_id', p_request_id));

    RETURN jsonb_build_object(
        'id', p_request_id,
        'status', 'approved',
        'client_outstanding_balance', v_request.overage_amount
    );
END;
$$;

-- -----------------------------------------------------------
-- REJECT OVERAGE REQUEST
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reject_overage(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request record;
    v_operator_id uuid;
BEGIN
    SELECT * INTO v_request FROM public.overage_requests WHERE id = p_request_id FOR UPDATE;
    IF v_request.id IS NULL THEN
        RAISE EXCEPTION 'Overage request not found' USING ERRCODE = '20000';
    END IF;
    IF v_request.status <> 'pending' THEN
        RAISE EXCEPTION 'Overage request is not pending' USING ERRCODE = '20000';
    END IF;

    v_operator_id := auth.uid();

    UPDATE public.overage_requests
    SET status = 'rejected', reviewed_at = now(), reviewed_by = v_operator_id
    WHERE id = p_request_id;

    INSERT INTO public.metrics_events (event_type, value, metadata)
    VALUES ('overage_rejected', 0, jsonb_build_object('request_id', p_request_id));

    RETURN jsonb_build_object(
        'id', p_request_id,
        'status', 'rejected',
        'client_outstanding_balance', 0
    );
END;
$$;

-- -----------------------------------------------------------
-- RECORD PAYMENT
-- Allows partial payments and overpayment-to-credit
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_payment(
    p_client_id uuid,
    p_amount numeric,
    p_method public.payment_method,
    p_idempotency_key uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_client record;
    v_new_outstanding numeric;
    v_credit_applied numeric;
    v_operator_id uuid;
BEGIN
    SELECT * INTO v_client FROM public.clients WHERE id = p_client_id FOR UPDATE;
    IF v_client.id IS NULL THEN
        RAISE EXCEPTION 'Client not found' USING ERRCODE = '20000';
    END IF;

    -- Idempotency check
    IF EXISTS (SELECT 1 FROM public.payments WHERE id = p_idempotency_key) THEN
        RETURN (SELECT jsonb_build_object('id', id, 'client_id', client_id, 'amount', amount) FROM public.payments WHERE id = p_idempotency_key);
    END IF;

    v_new_outstanding := GREATEST(v_client.outstanding_balance - p_amount, 0);
    v_credit_applied := v_client.outstanding_balance - v_new_outstanding;

    INSERT INTO public.payments (client_id, amount, method, recorded_by)
    VALUES (p_client_id, p_amount, p_method, auth.uid());

    v_operator_id := auth.uid();

    UPDATE public.clients
    SET outstanding_balance = v_new_outstanding,
        credit_balance = credit_balance + (p_amount - v_credit_applied)
    WHERE id = p_client_id;

    INSERT INTO public.metrics_events (event_type, station_id, value, metadata)
    VALUES ('payment', NULL, p_amount, jsonb_build_object(
        'client_id', p_client_id,
        'method', p_method,
        'credit_applied', v_credit_applied
    ));

    RETURN jsonb_build_object(
        'id', v_operator_id,
        'client_id', p_client_id,
        'amount', p_amount,
        'method', p_method,
        'outstanding_balance', v_new_outstanding,
        'credit_applied', v_credit_applied
    );
END;
$$;

-- -----------------------------------------------------------
-- RESET QUOTA
-- Resets all quotas to configured allotment, applies credit_balance
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_quota(p_period_start date, p_period_end date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quota record;
    v_credit_client record;
    v_reset_count integer := 0;
    v_credit_applied_count integer := 0;
BEGIN
    FOR v_quota IN
        SELECT id, client_id, fuel_type_id, amount_liters
        FROM public.quotas
        WHERE current_period_end < p_period_start
    LOOP
        UPDATE public.quotas
        SET remaining_liters = amount_liters,
            current_period_start = p_period_start,
            current_period_end = p_period_end
        WHERE id = v_quota.id;
        v_reset_count := v_reset_count + 1;
    END LOOP;

    FOR v_credit_client IN
        SELECT id, credit_balance FROM public.clients WHERE credit_balance > 0
    LOOP
        UPDATE public.clients
        SET outstanding_balance = outstanding_balance + credit_balance,
            credit_balance = 0
        WHERE id = v_credit_client.id;
        v_credit_applied_count := v_credit_applied_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'quota_reset_count', v_reset_count,
        'credit_applied_count', v_credit_applied_count
    );
END;
$$;

-- -----------------------------------------------------------
-- CROSS-STATION REPORT
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_cross_station_report(
    p_start_date date,
    p_end_date date,
    p_station_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
    SELECT jsonb_build_object(
        'total_fillups', COALESCE(SUM(t.liters), 0),
        'total_revenue', COALESCE(SUM(t.total_price), 0),
        'overage_count', COALESCE(SUM(CASE WHEN t.is_overage THEN 1 ELSE 0 END), 0),
        'by_fuel_type', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('fuel_type', ft.name, 'liters', COALESCE(SUM(t.liters), 0), 'revenue', COALESCE(SUM(t.total_price), 0)))
            FROM public.fill_up_transactions t
            JOIN public.fuel_types ft ON ft.id = t.fuel_type_id
            WHERE t.created_at >= p_start_date::timestamptz
              AND t.created_at < (p_end_date + 1)::timestamptz
              AND (p_station_id IS NULL OR t.station_id = p_station_id)
            GROUP BY ft.name
        ), '[]'::jsonb),
        'by_station', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('station', s.name, 'liters', COALESCE(SUM(t.liters), 0), 'revenue', COALESCE(SUM(t.total_price), 0)))
            FROM public.fill_up_transactions t
            JOIN public.stations s ON s.id = t.station_id
            WHERE t.created_at >= p_start_date::timestamptz
              AND t.created_at < (p_end_date + 1)::timestamptz
              AND (p_station_id IS NULL OR t.station_id = p_station_id)
            GROUP BY s.name
        ), '[]'::jsonb)
    );
$$;
