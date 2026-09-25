"use client";

import { useState, useTransition } from "react";
import { supabase } from "@/supabase/client";
import { logFillUp } from "@/lib/logger";

export function PriceManagement() {
  const [prices, setPrices] = useState<any[]>([]);
  const [fuelTypeId, setFuelTypeId] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [isPending, startTransition] = useTransition();

  async function loadPrices() {
    const { data, error } = await supabase.rpc("list_prices", {});
    if (!error && data) setPrices(data as any[]);
  }

  async function handleAddPrice(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const { data, error } = await supabase.rpc("set_price", {
        p_fuel_type_id: fuelTypeId,
        p_price_per_liter: Number(pricePerLiter),
        p_effective_from: effectiveFrom,
      });
      if (!error) await loadPrices();
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Price Management</h1>

      <form onSubmit={handleAddPrice} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Fuel Type</label>
          <input
            type="text"
            value={fuelTypeId}
            onChange={(e) => setFuelTypeId(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Price per Liter
          </label>
          <input
            type="number"
            min="0.0001"
            step="0.0001"
            value={pricePerLiter}
            onChange={(e) => setPricePerLiter(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Effective From
          </label>
          <input
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add Price"}
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Historical Prices</h2>
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left text-sm font-medium">Fuel Type</th>
                <th className="p-4 text-left text-sm font-medium">
                  Price (L)
                </th>
                <th className="p-4 text-left text-sm font-medium">
                  Effective From
                </th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p: any) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-4">{p.fuel_type}</td>
                  <td className="p-4">${p.price_per_liter.toFixed(4)}</td>
                  <td className="p-4">{p.effective_from}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}