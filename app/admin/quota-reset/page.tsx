"use client";

import { useState, useTransition } from "react";
import { supabase } from "@/supabase/client";
import { logFillUp } from "@/lib/logger";

export default function QuotaResetPage() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleReset() {
    startTransition(async () => {
      setError("");
      try {
        const { data, error: rpcError } = await supabase.rpc("reset_quota", {
          p_period_start: new Date().toISOString().split("T")[0],
          p_period_end: "",
        });
        if (rpcError) throw rpcError;
        setResult(data);
        logFillUp("admin", "", "success");
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  return (
    <div className="flex min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-4">Quota Reset</h1>
        <p className="text-muted-foreground mb-6">
          Reset all client quotas to their configured allotment for the new
          period. Credit balances will be automatically applied.
        </p>

        <button
          onClick={handleReset}
          disabled={isPending}
          className="rounded-lg bg-destructive px-6 py-3 text-destructive-foreground disabled:opacity-50"
        >
          {isPending ? "Resetting..." : "Reset All Quotas"}
        </button>

        {error && <p className="text-red-600 mt-4">{error}</p>}
        {result && (
          <div className="mt-4 rounded-lg border p-4">
            <p>
              Quotas reset: {result.quota_reset_count}
            </p>
            <p>
              Credit applied: {result.credit_applied_count}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}