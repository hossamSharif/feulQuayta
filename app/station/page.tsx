"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/supabase/client";
import { logClientLookup } from "@/lib/logger";
import { FillUpForm } from "@/components/station/fillup-form";
import { ClientDetail } from "@/components/station/client-detail";
import { OfflineGuard } from "@/components/station/offline-guard";
import { useOnline } from "@/components/station/offline-guard";

export default function StationPage() {
  const [plate, setPlate] = useState("");
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fuelTypes, setFuelTypes] = useState<
    { id: string; name: string; unit: string }[]
  >([]);
  const isOnline = useOnline();

  const handleLookup = useCallback(async () => {
    if (!plate.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase.rpc("lookup_client_by_plate", {
        p_plate: plate.trim(),
      });
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

  async function loadFuelTypes() {
    const { data, error } = await supabase
      .from("fuel_types")
      .select("id, name, unit")
      .order("name");
    if (!error && data) setFuelTypes(data as any[]);
  }

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
          <OfflineGuard
            clientScope={client.quotas?.[0]?.scope ?? null}
            isClientOnline={isOnline}
          >
            <ClientDetail client={client} />
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Record Fill-up</h3>
              <FillUpForm
                plate={plate}
                clientId={client.id}
                vehicleId={client.vehicles?.[0]?.id ?? ""}
                stationId=""
                fuelTypes={fuelTypes}
              />
            </div>
          </OfflineGuard>
        )}
      </div>
    </main>
  );
}