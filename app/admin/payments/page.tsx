"use client";

import { PaymentForm } from "@/components/admin/payment-form";
import { PaymentHistory } from "@/components/admin/payment-history";
import { useState } from "react";

export default function PaymentsPage() {
  const [selectedClient, setSelectedClient] = useState("");

  return (
    <div className="flex min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-4">Payments</h1>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Record Payment</h2>
            <PaymentForm />
          </div>
          <div>
            <PaymentHistory clientId={selectedClient} />
          </div>
        </div>
      </div>
    </div>
  );
}