"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { logOverageRequest } from "@/lib/logger";

export default function OverageDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverage() {
      const { data, error } = await supabase.rpc("get_overage_detail", {
        p_request_id: params.id,
      });
      if (!error && data) setRequest(data);
      setLoading(false);
    }
    loadOverage();
  }, [params.id]);

  async function handleApprove() {
    const { error } = await supabase.rpc("approve_overage", {
      p_request_id: params.id,
    });
    if (!error) {
      logOverageRequest("admin", params.id, "approved");
      window.location.href = "/admin/overages";
    }
  }

  async function handleReject() {
    const { error } = await supabase.rpc("reject_overage", {
      p_request_id: params.id,
    });
    if (!error) {
      logOverageRequest("admin", params.id, "rejected");
      window.location.href = "/admin/overages";
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!request)
    return <p className="text-muted-foreground">Overage request not found</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">
        Overage Request #{params.id}
      </h1>

      <div className="rounded-lg border p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="font-medium">{request.client_id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{request.status}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Overage Amount</p>
            <p className="font-medium">${request.overage_amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="font-medium">
              {new Date(request.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {request.status === "pending" && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleApprove}
              className="rounded-lg bg-green-600 px-6 py-3 text-white"
            >
              Approve Overage
            </button>
            <button
              onClick={handleReject}
              className="rounded-lg bg-red-600 px-6 py-3 text-white"
            >
              Reject Overage
            </button>
          </div>
        )}
      </div>
    </div>
  );
}