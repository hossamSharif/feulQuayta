-- ============================================================
-- Qadra Oil Fuel Quota & Billing — Initial Schema
-- ============================================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------
-- ENUM TYPES
-- -----------------------------------------------------------
CREATE TYPE public.role AS ENUM ('admin', 'station_user');
CREATE TYPE public.period_type AS ENUM ('weekly', 'monthly', 'custom');
CREATE TYPE public.quota_scope AS ENUM ('single_station', 'network_wide');
CREATE TYPE public.overage_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'digital_wallet', 'bank_transfer');

-- -----------------------------------------------------------
-- STATIONS
-- -----------------------------------------------------------
CREATE TABLE public.stations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    location text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------
-- PROFILES (linked to Supabase Auth)
-- -----------------------------------------------------------
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role public.role NOT NULL DEFAULT 'station_user',
    station_id uuid REFERENCES public.stations(id) ON DELETE SET NULL,
    full_name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------
-- CLIENTS
-- -----------------------------------------------------------
CREATE TABLE public.clients (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    contact_info text,
    outstanding_balance numeric(15,2) DEFAULT 0,
    credit_balance numeric(15,2) DEFAULT 0,
    created_at timestamptz DEFAULT now()
};

-- -----------------------------------------------------------
-- VEHICLES (plate globally unique)
-- -----------------------------------------------------------
CREATE TABLE public.vehicles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    plate text NOT NULL UNIQUE,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_vehicles_plate ON public.vehicles(plate);

-- -----------------------------------------------------------
-- FUEL TYPES
-- -----------------------------------------------------------
CREATE TABLE public.fuel_types (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    unit text DEFAULT 'liter'
);

-- -----------------------------------------------------------
-- PRICES (versioned by effective date)
-- -----------------------------------------------------------
CREATE TABLE public.prices (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    fuel_type_id uuid REFERENCES public.fuel_types(id) ON DELETE CASCADE NOT NULL,
    price_per_liter numeric(10,4) NOT NULL,
    effective_from date NOT NULL,
    effective_to date,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_prices_fuel_type ON public.prices(fuel_type_id);
CREATE INDEX idx_prices_effective_from ON public.prices(effective_from);

-- -----------------------------------------------------------
-- QUOTAS
-- -----------------------------------------------------------
CREATE TABLE public.quotas (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    fuel_type_id uuid REFERENCES public.fuel_types(id) ON DELETE CASCADE NOT NULL,
    amount_liters numeric(10,2) NOT NULL,
    period_type public.period_type NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    scope public.quota_scope NOT NULL DEFAULT 'single_station',
    station_id uuid REFERENCES public.stations(id) ON DELETE SET NULL,
    remaining_liters numeric(10,2) NOT NULL,
    current_period_start date NOT NULL,
    current_period_end date NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_quotas_client_id ON public.quotas(client_id);
CREATE INDEX idx_quotas_station_id ON public.quotas(station_id);

-- -----------------------------------------------------------
-- FILL-UP TRANSACTIONS (append-only audit table)
-- -----------------------------------------------------------
CREATE TABLE public.fill_up_transactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    station_id uuid REFERENCES public.stations(id) ON DELETE NOT NULL,
    client_id uuid REFERENCES public.clients(id) ON DELETE NOT NULL,
    vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE NOT NULL,
    fuel_type_id uuid REFERENCES public.fuel_types(id) ON DELETE NOT NULL,
    liters numeric(10,2) NOT NULL,
    price_per_liter numeric(10,4) NOT NULL,
    total_price numeric(15,2) NOT NULL,
    is_overage boolean DEFAULT false,
    overage_request_id uuid REFERENCES public.overage_requests(id),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_fillups_client_id ON public.fill_up_transactions(client_id);
CREATE INDEX idx_fillups_station_id ON public.fill_up_transactions(station_id);
CREATE INDEX idx_fillups_created_at ON public.fill_up_transactions(created_at);

-- -----------------------------------------------------------
-- OVERAGE REQUESTS
-- -----------------------------------------------------------
CREATE TABLE public.overage_requests (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    fill_up_transaction_id uuid REFERENCES public.fill_up_transactions(id) ON DELETE CASCADE NOT NULL,
    client_id uuid REFERENCES public.clients(id) ON DELETE NOT NULL,
    overage_amount numeric(15,2) NOT NULL,
    status public.overage_status NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    reviewed_at timestamptz,
    reviewed_by uuid REFERENCES public.profiles(id),
    CONSTRAINT unique_fillup_overage UNIQUE (fill_up_transaction_id)
);

CREATE INDEX idx_overages_status ON public.overage_requests(status);

-- -----------------------------------------------------------
-- PAYMENTS (append-only audit table)
-- -----------------------------------------------------------
CREATE TABLE public.payments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    amount numeric(15,2) NOT NULL,
    method public.payment_method NOT NULL,
    recorded_by uuid REFERENCES public.profiles(id) NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_payments_client_id ON public.payments(client_id);

-- -----------------------------------------------------------
-- AUDIT LOGS
-- -----------------------------------------------------------
CREATE TABLE public.audit_logs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    operation text NOT NULL,
    operator_id uuid REFERENCES public.profiles(id),
    entity_type text NOT NULL,
    entity_id uuid,
    outcome text,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

-- -----------------------------------------------------------
-- METRICS / EVENTS (operational metrics)
-- -----------------------------------------------------------
CREATE TABLE public.metrics_events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_type text NOT NULL,
    station_id uuid REFERENCES public.stations(id),
    value numeric(15,2),
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_metrics_created ON public.metrics_events(created_at);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fill_up_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overage_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_events ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (for RPC functions)
ALTER TABLE public.stations FORCE ROW LEVEL SECURITY;

-- Admin policy: full access
CREATE POLICY "Admin full access" ON public.stations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    );

-- Station user: read only their station's data
CREATE POLICY "Station user read own station" ON public.quotas
    FOR SELECT USING (
        station_id = (SELECT station_id FROM public.profiles WHERE id = auth.uid())
    );

-- Clients visible to station users for their station
CREATE POLICY "Station user view clients" ON public.clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.vehicles v
            JOIN public.quotas q ON q.client_id = clients.id
            WHERE q.station_id = (SELECT station_id FROM public.profiles WHERE id = auth.uid())
            LIMIT 1
        )
    );

-- Public read for prices (needed for lookup)
CREATE POLICY "Public read prices" ON public.prices
    FOR SELECT USING (true);

-- Public read for fuel types
CREATE POLICY "Public read fuel_types" ON public.fuel_types
    FOR SELECT USING (true);

-- ============================================================
-- INDEXES FOR SCALE (dozens of stations, thousands of tx/day)
-- ============================================================
CREATE UNIQUE INDEX idx_vehicles_plate_unique ON public.vehicles(plate);
CREATE INDEX idx_fillups_client_created ON public.fill_up_transactions(client_id, created_at);
CREATE INDEX idx_fillups_station_created ON public.fill_up_transactions(station_id, created_at);

-- ============================================================
-- AUDIT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (operation, operator_id, entity_type, entity_id, outcome, metadata)
    VALUES (TG_OP, auth.uid(), TG_TABLE_NAME, NEW.id, 'executed', NULL);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_fillups AFTER INSERT ON public.fill_up_transactions
    FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_payments AFTER INSERT ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.log_audit();
