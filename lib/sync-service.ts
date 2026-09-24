import { supabase } from "../supabase/client";
import { offlineDb, getPendingOfflineFillUps, clearSyncedFillUps } from "./offline-store";
import type { FillUpTransaction } from "./types";

interface SyncResult {
  synced: string[];
  failed: { id: string; error: string }[];
}

export async function syncOfflineFillUps(): Promise<SyncResult> {
  const pending = await getPendingOfflineFillUps();
  const result: SyncResult = { synced: [], failed: [] };

  for (const fillUp of pending) {
    try {
      const { data, error } = await supabase
        .rpc("record_fillup", {
          p_station_id: fillUp.station_id,
          p_client_id: fillUp.client_id,
          p_vehicle_id: fillUp.vehicle_id,
          p_fuel_type_id: fillUp.fuel_type_id,
          p_liters: fillUp.liters,
          p_price_per_liter: fillUp.price_per_liter,
          p_total_price: fillUp.total_price,
          p_idempotency_key: fillUp.id,
        });

      if (error) throw error;
      result.synced.push(fillUp.id);
    } catch (err) {
      result.failed.push({ id: fillUp.id, error: String(err) });
    }
  }

  if (result.synced.length > 0) {
    await clearSyncedFillUps(result.synced);
  }

  return result;
}
