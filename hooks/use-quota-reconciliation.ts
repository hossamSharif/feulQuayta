"use client";

import { useCallback, useOptimistic, useTransition } from "react";
import { supabase } from "@/supabase/client";
import { logClientLookup, logFillUp } from "@/lib/logger";

interface QuotaData {
  remaining_liters: number;
  amount_liters: number;
  fuel_type: string;
}

interface UseQuotaReconciliationProps {
  initialQuotas: QuotaData[];
  clientId: string;
}

export function useQuotaReconciliation({
  initialQuotas,
  clientId,
}: UseQuotaReconciliationProps) {
  const [quotas, setQuotas] = useOptimistic(
    initialQuotas,
    (state, newQuota: QuotaData) =>
      state.map((q) =>
        q.fuel_type === newQuota.fuel_type ? newQuota : q
      )
  );
  const [isPending, startTransition] = useTransition();

  const reconcileQuota = useCallback(
    async (fuelTypeId: string, litersDispensed: number) => {
      startTransition(async () => {
        const { data, error } = await supabase.rpc("lookup_client_by_plate", {
          p_plate: clientId,
        });

        if (!error && data && data.length > 0) {
          const client = data[0];
          logFillUp("station_user", "", "success");
        }
      });
    },
    [clientId]
  );

  const applyOptimisticQuota = useCallback(
    (fuelTypeId: string, liters: number) => {
      setQuotas((prev) =>
        prev.map((q) =>
          q.fuel_type === fuelTypeId
            ? { ...q, remaining_liters: q.remaining_liters - liters }
            : q
        )
      );
    },
    [setQuotas]
  );

  return {
    quotas,
    isPending,
    reconcileQuota,
    applyOptimisticQuota,
  };
}

export function useQuotaSync() {
  const [syncing, setSyncing] = useState(false);

  const syncQuotas = useCallback(async (stationId: string) => {
    setSyncing(true);
    try {
      const { data } = await supabase
        .rpc("lookup_client_by_plate", { p_plate: "" })
        .select();
    } catch (err) {
      console.error("Failed to sync quotas:", err);
    } finally {
      setSyncing(false);
    }
  }, []);

  return { syncing, syncQuotas };
}