-- ============================================================
-- VEHICLE PLATE UNIQUE VALIDATION
-- ============================================================

-- Vehicle plate already has UNIQUE constraint from initial schema
-- This migration adds additional validation and index optimization

-- Ensure unique index exists (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_plate_unique ON public.vehicles(plate);

-- Add check constraint for plate format validation (optional - adjust regex as needed)
-- This example enforces alphanumeric plates with optional spaces/hyphens
ALTER TABLE public.vehicles
    ADD CONSTRAINT chk_vehicle_plate_format
    CHECK (plate ~ '^[A-Za-z0-9\s\-]{2,20}$');

-- Add trigger to prevent duplicate plate insertions with better error message
CREATE OR REPLACE FUNCTION public.validate_vehicle_plate()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.vehicles
        WHERE plate = NEW.plate AND id <> NEW.id
    ) THEN
        RAISE EXCEPTION 'Vehicle plate "%" already exists. Plate numbers must be globally unique.', NEW.plate
        USING ERRCODE = '23505';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_vehicle_plate ON public.vehicles;
CREATE TRIGGER validate_vehicle_plate
    BEFORE INSERT OR UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION public.validate_vehicle_plate();