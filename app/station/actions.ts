"use server";

import { createServerSupabaseClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

export async function recordFillUpAction(formData: FormData) {
  const supabase = createServerSupabaseClient();

  const stationId = formData.get("stationId") as string;
  const clientId = formData.get("clientId") as string;
  const vehicleId = formData.get("vehicleId") as string;
  const fuelTypeId = formData.get("fuelTypeId") as string;
  const liters = Number.parseFloat(formData.get("liters") as string);
  const pricePerLiter = Number.parseFloat(
    formData.get("pricePerLiter") as string
  );
  const totalPrice = Number.parseFloat(formData.get("totalPrice") as string);
  const idempotencyKey =
    (formData.get("idempotencyKey") as string) || crypto.randomUUID();

  const { data, error } = await supabase.rpc("record_fillup", {
    p_station_id: stationId,
    p_client_id: clientId,
    p_vehicle_id: vehicleId,
    p_fuel_type_id: fuelTypeId,
    p_liters: liters,
    p_price_per_liter: pricePerLiter,
    p_total_price: totalPrice,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/station");
  return { success: true, data };
}
