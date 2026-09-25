import { offlineDb } from "@/lib/offline-store";
import { supabase } from "@/supabase/client";
import type { Client, Vehicle, Quota } from "@/lib/types";

interface StationSnapshot {
  clients: (Client & { scope: "single_station" | "network_wide" })[];
  vehicles: Vehicle[];
  quotas: Quota[];
  lastUpdated: string;
}

export async function cacheStationSnapshot(stationId: string) {
  try {
    const { data, error } = await supabase
      .rpc("lookup_station_snapshot", { p_station_id: stationId });

    if (error) throw error;

    const snapshot: StationSnapshot = {
      clients: data?.clients ?? [],
      vehicles: data?.vehicles ?? [],
      quotas: data?.quotas ?? [],
      lastUpdated: new Date().toISOString(),
    };

    await offlineDb.clients.bulkPut(snapshot.clients as any);
    await offlineDb.vehicles.bulkPut(snapshot.vehicles as any);
    await offlineDb.quotas.bulkPut(snapshot.quotas as any);

    return snapshot;
  } catch (err) {
    console.error("Failed to cache station snapshot:", err);
    throw err;
  }
}

export async function getCachedSnapshot(): Promise<StationSnapshot | null> {
  try {
    const clients = await offlineDb.clients.toArray();
    const vehicles = await offlineDb.vehicles.toArray();
    const quotas = await offlineDb.quotas.toArray();

    if (!clients.length) return null;

    return {
      clients: clients as any,
      vehicles: vehicles as any,
      quotas: quotas as any,
      lastUpdated: "",
    };
  } catch {
    return null;
  }
}