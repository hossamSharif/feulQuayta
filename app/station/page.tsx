"use client";
import { useState, useCallback } from "react";
import { supabase } from "@/supabase/client";
import { logClientLookup } from "@/lib/logger";

export default function StationPage() {
  const [plate, setPlate] = useState("");
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLookup = useCallback(async () => {
    if (!plate.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase
        .rpc("lookup_client_by_plate", { p_plate: plate.trim() });
      if (err) throw err;
      if (!data || data.length === 0) {
        setError("No client found for this plate number");
        setClient(null);
      } else {
        setClient(data[0]);
      }
      logClientLookup("station_user", plate.trim(), data && data.length > 0 ? "found" : "not_found");
    } catch (e) {
      setError("Failed to lookup client");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [plate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <h1 className="text-2xl font-bold text-primary mb-6">Station User</h1>
      <div className="w-full max-w-md">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="Enter vehicle plate number"
            className="flex-1 rounded-lg border p-3 text-lg"
          />
          <button
            onClick={handleLookup}
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50"
          >
            {loading ? "..." : "Search"}
          </button>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {client && (
          <div className="rounded-lg border p-4">
            <h2 className="text-xl font-semibold">{client.name}</h2>
            <p className="text-muted-foreground">{client.contact_info}</p>
            <h3 className="mt-4 font-semibold">Quota Balances</h3>
            {client.quotas?.map((q: any, i: number) => (
              <div key={i} className="flex justify-between py-1">
                <span>{q.fuel_type}:</span>
                <span>{q.remaining_liters}L / {q.amount_liters}L</span>
              </div>
            ))}
            <h3 className="mt-4 font-semibold">Outstanding Balance</h3>
            <p className="text-2xl font-bold">${client.outstanding_balance?.toFixed(2)}</p>
          </div>
        )}
      </div>
    </main>
  );
}
