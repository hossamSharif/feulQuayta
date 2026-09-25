"use client";

import { OverageList } from "@/components/admin/overage-list";

export default function OveragesPage() {
  return (
    <div className="flex min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <OverageList />
      </div>
    </div>
  );
}