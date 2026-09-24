import Dexie, { type Table } from "dexie";
import type {
  Client,
  Vehicle,
  Quota,
  FillUpTransaction,
} from "./types";

export class OfflineStore extends Dexie {
  public clients!: Table<Client & { id: string }>;
  public vehicles!: Table<Vehicle & { id: string }>;
  public quotas!: Table<Quota & { id: string }>;
  public fillUps!: Table<FillUpTransaction & { id: string }>;

  constructor() {
    super("QadraOilOffline");
    this.version(1).stores({
      clients: "id, name",
      vehicles: "id, plate, client_id",
      quotas: "id, client_id, fuel_type_id",
      fillUps: "id, client_id, station_id, created_at",
    });
  }
}

export const offlineDb = new OfflineStore();

export async function cacheStationSnapshot(
  stationId: string,
  clients: Client[],
  vehicles: Vehicle[],
  quotas: Quota[]
) {
  await offlineDb.clients.bulkPut(clients as any);
  await offlineDb.vehicles.bulkPut(vehicles as any);
  await offlineDb.quotas.bulkPut(quotas as any);
}

export async function getCachedClients(stationId: string): Promise<Client[]> {
  return offlineDb.clients.toArray();
}

export async function queueOfflineFillUp(fillUp: FillUpTransaction) {
  await offlineDb.fillUps.put(fillUp as any);
}

export async function getPendingOfflineFillUps(): Promise<FillUpTransaction[]> {
  return offlineDb.fillUps.toArray();
}

export async function clearSyncedFillUps(ids: string[]) {
  await offlineDb.fillUps.bulkDelete(ids);
}
