"use client";

import { useState, useTransition } from "react";
import { supabase } from "@/supabase/client";
import { logOverageRequest } from "@/lib/logger";

interface OverageRequest {
  id: string;
  fill_up_transaction_id: string;
  client_id: string;
  overage_amount: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export function OverageList() {
  const [overages, setOverages] = useState<OverageRequest[]>([]);
  const [filter, setFilter] = useState<string>("pending");
  const [isPending, startTransition] = useTransition();

  async function loadOverages() {
    const { data, error } = await supabase
      .rpc("list_overage_requests", { p_status: filter })
      .select()
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOverages(data as OverageRequest[]);
    }
  }

  async function handleApprove(requestId: string) {
    startTransition(async () => {
      const { data, error } = await supabase.rpc("approve_overage", {
        p_request_id: requestId,
      });
      if (!error && data) {
        logOverageRequest("admin", requestId, "approved");
        await loadOverages();
      }
    });
  }

  async function handleReject(requestId: string) {
    startTransition(async () => {
      const { data, error } = await supabase.rpc("reject_overage", {
        p_request_id: requestId,
      });
      if (!error && data) {
        logOverageRequest("admin", requestId, "rejected");
        await loadOverages();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Overage Requests</h1>
        <div className="flex gap-2">
          {["pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                filter === status
                  ? "bg-primary text-primary-foreground"
                  : "border hover:bg-secondary"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {isPending && <p className="text-muted-foreground">Loading...</p>}

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left text-sm font-medium">
                Client
              </th>
              <th className="p-4 text-left text-sm font-medium">
                Overage Amount
              </th>
              <th className="p-4 text-left text-sm font-medium">
                Status
              </th>
              <th className="p-4 text-left text-sm font-medium">
                Created
              </th>
              <th className="p-4 text-left text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {overages.map((overage) => (
              <tr key={overage.id} className="border-b last:border-0">
                <td className="p-4">{overage.client_id}</td>
                <td className="p-4">${overage.overage_amount.toFixed(2)}</td>
                <td className="p-4 capitalize">{overage.status}</td>
                <td className="p-4">
                  {new Date(overage.created_at).toLocaleString()}
                </td>
                <td className="p-4">
                  {overage.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(overage.id)}
                        className="rounded bg-green-600 px-3 py-1 text-sm text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(overage.id)}
                        className="rounded bg-red-600 px-3 py-1 text-sm text-white"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OverageDetail({
  requestId,
}: {
  requestId: string;
}) {
  const [request, setRequest] = useState<any>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">
        Overage Request #{requestId}
      </h1>
      {request && (
        <div className="rounded-lg border p-6">
          <p>
            <strong>Status:</strong>{" "}
            <span className="capitalize">{request.status}</span>
          </p>
          <p>
            <strong>Amount:</strong> ${request.overage_amount.toFixed(2)}
          </p>
          <p>
            <strong>Created:</strong>{" "}
            {new Date(request.created_at).toLocaleString()}
          </p>
          {request.reviewed_at && (
            <p>
              <strong>Reviewed:</strong>{" "}
              {new Date(request.reviewed_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}