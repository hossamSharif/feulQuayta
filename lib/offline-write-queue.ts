import { offlineDb } from "./offline-store";
import type { FillUpTransaction } from "./types";

interface QueuedFillUp {
  id: string;
  clientId: string;
  vehicleId: string;
  stationId: string;
  fuelTypeId: string;
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
  queuedAt: string;
}

export async function queueOfflineFillUp(fillUp: QueuedFillUp) {
  await offlineDb.fillUps.put(fillUp as any);
}

export async function getPendingOfflineQueue(): Promise<QueuedFillUp[]> {
  return offlineDb.fillUps.toArray() as any;
}

export async function clearSyncedQueue(ids: string[]) {
  await offlineDb.fillUps.bulkDelete(ids);
}

export async function getQueueCount(): Promise<number> {
  return offlineDb.fillUps.count();
}

export function isNetworkWideClient(clientScope: string | null | undefined): boolean {
  return clientScope === "network_wide";
}

export function isSingleStationClient(clientScope: string | null | undefined): boolean {
  return clientScope === "single_station";
}