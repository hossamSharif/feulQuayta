-- ============================================================
-- PRICE HISTORY — Reference price at transaction time
-- ============================================================

-- Add price snapshot fields to fill_up_transactions
-- These will be populated by the record_fillup RPC
ALTER TABLE public.fill_up_transactions
    ADD COLUMN IF NOT EXISTS price_per_liter_snapshot numeric(10,4),
    ADD COLUMN IF NOT EXISTS total_price_snapshot numeric(15,2);

-- Create trigger to automatically set price snapshots from prices table
-- This ensures historical accuracy even if prices change later

CREATE OR REPLACE FUNCTION public.set_fillup_price_snapshots()
RETURNS TRIGGER AS $$
DECLARE
    v_price numeric(10,4);
BEGIN
    -- Get the price effective at transaction time
    SELECT price_per_liter
    INTO v_price
    FROM public.prices
    WHERE fuel_type_id = NEW.fuel_type_id
      AND effective_from <= NEW.created_at::date
    ORDER BY effective_from DESC
    LIMIT 1;

    IF v_price IS NOT NULL THEN
        NEW.price_per_liter_snapshot := v_price;
        NEW.total_price_snapshot := NEW.liters * v_price;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_fillup_price ON public.fill_up_transactions;
CREATE TRIGGER set_fillup_price
    BEFORE INSERT ON public.fill_up_transactions
    FOR EACH ROW EXECUTE FUNCTION public.set_fillup_price_snapshots();

-- Update existing records if needed
UPDATE public.fill_up_transactions t
SET price_per_liter_snapshot = t.price_per_liter,
    total_price_snapshot = t.total_price
WHERE price_per_liter_snapshot IS NULL;