"use client";

import { useState, useTransition } from "react";
import { supabase } from "@/supabase/client";
import { logFillUp } from "@/lib/logger";

interface QuotaFormData {
  clientId: string;
  fuelTypeId: string;
  amountLiters: number;
}

export function QuotaManagement() {
  const [quotas, setQuotas] = useState<any[]>([]);
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  async function loadQuotas() {
    const { data, error } = await supabase.rpc("list_quotas", {
      p_client_id: clientId,
    });
    if (!error && data) setQuotas(data as any[]);
  }

  async function handleSetQuota(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const { data, error } = await supabase.rpc("set_quota", {
        p_client_id: clientId,
        p_fuel_type_id: "",
        p_amount_liters: Number(amount),
      });
      if (!error) {
        await loadQuotas();
      }
    });
  }

  async function handleResetQuota() {
    startTransition(async () => {
      const { data, error } = await supabase.rpc("reset_quota", {
        p_period_start: new Date().toISOString().split("T")[0],
        p_period_end: "",
      });
      if (!error) {
        logFillUp("admin", "", "success");
      }
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Quota Management</h1>

      <form onSubmit={handleSetQuota} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Client ID</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amount (L)</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50"
        >
          {isPending ? "Setting..." : "Set Quota"}
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Current Quotas</h2>
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left text-sm font-medium">Fuel Type</th>
                <th className="p-4 text-left text-sm font-medium">
                  Amount (L)
                </th>
                <th className="p-4 text-left text-sm font-medium">
                  Remaining (L)
                </th>
                <th className="p-4 text-left text-sm font-medium">Period</th>
              </tr>
            </thead>
            <tbody>
              {quotas.map((q: any) => (
                <tr key={q.id} className="border-b last:border-0">
                  <td className="p-4">{q.fuel_type}</td>
                  <td className="p-4">{q.amount_liters}</td>
                  <td className="p-4">{q.remaining_liters}</td>
                  <td className="p-4">{q.period_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={handleResetQuota}
        disabled={isPending}
        className="rounded-lg bg-destructive px-6 py-3 text-destructive-foreground disabled:opacity-50"
      >
        {isPending ? "Resetting..." : "Reset All Quotas"}
      </button>
    </div>
  );
}