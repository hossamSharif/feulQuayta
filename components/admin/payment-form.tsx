"use client";

import { useState, useTransition } from "react";
import { supabase } from "@/supabase/client";
import { logPayment } from "@/lib/logger";

interface PaymentFormData {
  clientId: string;
  amount: number;
  method: "cash" | "card" | "digital_wallet" | "bank_transfer";
}

export function PaymentForm() {
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentFormData["method"]>("cash");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const parsedAmount = Number(amount);
    if (parsedAmount <= 0) {
      setError("Amount must be greater than zero");
      return;
    }

    startTransition(async () => {
      const { data, error: rpcError } = await supabase.rpc("record_payment", {
        p_client_id: clientId,
        p_amount: parsedAmount,
        p_method: method,
        p_idempotency_key: crypto.randomUUID(),
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      const outstanding = (data as any).outstanding_balance;
      const credit = (data as any).credit_applied;

      setSuccess(
        credit > 0
          ? `Payment recorded. Overpayment of $${credit.toFixed(2)} applied as credit. Outstanding balance: $${outstanding.toFixed(2)}`
          : `Payment recorded. Outstanding balance: $${outstanding.toFixed(2)}`
      );
      logPayment("admin", (data as any).id, parsedAmount, method);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label htmlFor="client" className="block text-sm font-medium mb-1">
          Client ID
        </label>
        <input
          id="client"
          type="text"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium mb-1">
          Amount ($)
        </label>
        <input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label htmlFor="method" className="block text-sm font-medium mb-1">
          Payment Method
        </label>
        <select
          id="method"
          value={method}
          onChange={(e) =>
            setMethod(e.target.value as PaymentFormData["method"])
          }
          className="w-full rounded-lg border p-3"
        >
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="digital_wallet">Digital Wallet</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50"
      >
        {isPending ? "Recording..." : "Record Payment"}
      </button>
    </form>
  );
}