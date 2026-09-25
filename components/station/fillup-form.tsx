"use client";

import { useMemo, useState, useTransition } from "react";
import { supabase } from "@/supabase/client";
import { generateIdempotencyKey, validateFillUpForm } from "@/lib/validation/fillup";
import { logFillUp } from "@/lib/logger";

interface FuelType {
  id: string;
  name: string;
  unit: string;
}

interface FillUpFormProps {
  plate: string;
  clientId: string;
  vehicleId: string;
  stationId: string;
  fuelTypes: FuelType[];
  onFillUpRecorded?: (result: any) => void;
}

export function FillUpForm({
  plate,
  clientId,
  vehicleId,
  stationId,
  fuelTypes,
  onFillUpRecorded,
}: FillUpFormProps) {
  const [fuelTypeId, setFuelTypeId] = useState("");
  const [liters, setLiters] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedFuelType = useMemo(
    () => fuelTypes.find((fuelType) => fuelType.id === fuelTypeId),
    [fuelTypeId, fuelTypes]
  );

  const total = useMemo(() => {
    const litersValue = Number(liters);
    const priceValue = Number(pricePerLiter);
    return litersValue > 0 && priceValue > 0 ? litersValue * priceValue : 0;
  }, [liters, pricePerLiter]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validation = validateFillUpForm({
      fuelTypeId,
      liters: Number(liters),
      pricePerLiter: Number(pricePerLiter),
    });

    if (!validation.valid) {
      setError(Object.values(validation.errors)[0] ?? "Please correct the form");
      return;
    }

    const idempotencyKey = generateIdempotencyKey();

    startTransition(async () => {
      const { data, error: rpcError } = await supabase.rpc("record_fillup", {
        p_station_id: stationId,
        p_client_id: clientId,
        p_vehicle_id: vehicleId,
        p_fuel_type_id: fuelTypeId,
        p_liters: Number(liters),
        p_price_per_liter: Number(pricePerLiter),
        p_total_price: total,
        p_idempotency_key: idempotencyKey,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      setSuccess(
        data?.is_overage
          ? "Fill-up recorded as overage and sent for approval"
          : "Fill-up recorded successfully"
      );
      logFillUp("station_user", data?.id, data?.is_overage ? "overage" : "success");
      onFillUpRecorded?.(data);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fuel-type" className="block text-sm font-medium mb-1">
          Fuel Type
        </label>
        <select
          id="fuel-type"
          value={fuelTypeId}
          onChange={(event) => setFuelTypeId(event.target.value)}
          required
          className="w-full rounded-lg border p-3"
        >
          <option value="">Select fuel type</option>
          {fuelTypes.map((fuelType) => (
            <option key={fuelType.id} value={fuelType.id}>
              {fuelType.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="liters" className="block text-sm font-medium mb-1">
          Liters
        </label>
        <input
          id="liters"
          type="number"
          min="0.01"
          step="0.01"
          value={liters}
          onChange={(event) => setLiters(event.target.value)}
          placeholder="0.00"
          required
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label htmlFor="price-per-liter" className="block text-sm font-medium mb-1">
          Price per Liter
        </label>
        <input
          id="price-per-liter"
          type="number"
          min="0.0001"
          step="0.0001"
          value={pricePerLiter}
          onChange={(event) => setPricePerLiter(event.target.value)}
          placeholder="0.0000"
          required
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div className="flex justify-between rounded-lg bg-secondary p-3">
        <span className="font-medium">Total</span>
        <span className="font-bold">${total.toFixed(2)}</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50"
      >
        {isPending ? "Recording..." : "Record Fill-up"}
      </button>
    </form>
  );
}