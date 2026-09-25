"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";

interface ReportData {
  totalFillups: number;
  totalRevenue: number;
  overageCount: number;
  byFuelType: any[];
  byStation: any[];
}

interface ReportChartProps {
  data: ReportData;
}

export function RevenueChart({ data }: ReportChartProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold mb-4">Revenue by Fuel Type</h3>
      <div className="space-y-2">
        {data.byFuelType.map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-24 text-sm">{item.fuel_type}</span>
            <div className="flex-1 bg-secondary rounded h-4">
              <div
                className="bg-primary h-4 rounded transition-all"
                style={{
                  width: `${(item.revenue / Math.max(data.totalRevenue, 1)) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm font-medium">
              ${item.revenue.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FillUpVolumeChart({ data }: ReportChartProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold mb-4">Fill-up Volume by Fuel Type</h3>
      <div className="space-y-2">
        {data.byFuelType.map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-24 text-sm">{item.fuel_type}</span>
            <div className="flex-1 bg-secondary rounded h-4">
              <div
                className="bg-green-600 h-4 rounded transition-all"
                style={{
                  width: `${(item.liters / Math.max(data.totalFillups, 1)) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm font-medium">{item.liters}L</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OverageRateChart({ data }: ReportChartProps) {
  const rate =
    data.totalFillups > 0
      ? ((data.overageCount / data.totalFillups) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold mb-4">Overage Rate</h3>
      <div className="text-4xl font-bold text-destructive">{rate}%</div>
      <p className="text-sm text-muted-foreground">
        {data.overageCount} overage requests out of {data.totalFillups} fill-ups
      </p>
    </div>
  );
}