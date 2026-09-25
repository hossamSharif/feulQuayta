"use client";

import { QuotaManagement } from "@/components/admin/quota-management";
import { PriceManagement } from "@/components/admin/price-management";
import { useState } from "react";

export default function QuotasPage() {
  const [activeTab, setActiveTab] = useState<"quotas" | "prices">(
    "quotas"
  );

  return (
    <div className="flex min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-4">
          Quota & Price Management
        </h1>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("quotas")}
            className={`rounded-lg px-4 py-2 ${
              activeTab === "quotas"
                ? "bg-primary text-primary-foreground"
                : "border"
            }`}
          >
            Quota Management
          </button>
          <button
            onClick={() => setActiveTab("prices")}
            className={`rounded-lg px-4 py-2 ${
              activeTab === "prices"
                ? "bg-primary text-primary-foreground"
                : "border"
            }`}
          >
            Price Management
          </button>
        </div>

        {activeTab === "quotas" && <QuotaManagement />}
        {activeTab === "prices" && <PriceManagement />}
      </div>
    </div>
  );
}