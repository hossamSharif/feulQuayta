"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import type { Payment } from "@/lib/types";

export function PaymentHistory({ clientId }: { clientId: string }) {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    async function loadPayments() {
      const { data, error } = await supabase
        .rpc("list_payments", { p_client_id: clientId })
        .select()
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPayments(data as Payment[]);
      }
    }
    if (clientId) loadPayments();
  }, [clientId]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Payment History</h2>
      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left text-sm font-medium">Amount</th>
              <th className="p-4 text-left text-sm font-medium">Method</th>
              <th className="p-4 text-left text-sm font-medium">Date</th>
              <th className="p-4 text-left text-sm font-medium">Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b last:border-0">
                <td className="p-4">${payment.amount.toFixed(2)}</td>
                <td className="p-4 capitalize">
                  {payment.method.replace("_", " ")}
                </td>
                <td className="p-4">
                  {new Date(payment.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">{payment.recorded_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}