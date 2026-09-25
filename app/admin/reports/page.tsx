"use client";

import { useState } from "react";
import { RevenueChart } from "@/components/admin/report-charts";
import { FillUpVolumeChart } from "@/components/admin/report-charts";
import { OverageRateChart } from "@/components/admin/report-charts";

interface ReportData {
  totalFillups: number;
  totalRevenue: number;
  overageCount: number;
  byFuelType: any[];
  byStation: any[];
}

export default function ReportsPage() {
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    stationId: "",
  });
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadReport() {
    setLoading(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      if (!response.ok) throw new Error("Failed to load report");
      const result = await response.json();
      setData({
        totalFillups: result.total_fillups,
        totalRevenue: result.total_revenue,
        overageCount: result.overage_count,
        byFuelType: result.by_fuel_type,
        byStation: result.by_station,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-4">
          Cross-Station Reports
        </h1>

        <form
          onSubmit={(e) => { e.preventDefault(); loadReport(); }}
          className="space-y-4 mb-6"
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="w-full rounded-lg border p-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="w-full rounded-lg border p-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Station ID
              </label>
              <input
                type="text"
                name="stationId"
                value={filters.stationId}
                onChange={(e) =>
                  setFilters({ ...filters, stationId: e.target.value })
                }
                className="w-full rounded-lg border p-3"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-3 text-primary-foreground"
          >
            Generate Report
          </button>
        </form>

        {loading && <p className="text-muted-foreground">Loading...</p>}
        {data && (
          <div className="grid grid-cols-2 gap-6">
            <RevenueChart data={data} />
            <FillUpVolumeChart data={data} />
            <OverageRateChart data={data} />
          </div>
        )}
      </div>
    </div>
  );
}