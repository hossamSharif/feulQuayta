"use client";

interface ClientDetailProps {
  client: any;
}

export function ClientDetail({ client }: ClientDetailProps) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-xl font-semibold">{client.name}</h2>
      <p className="text-muted-foreground">{client.contact_info}</p>

      <h3 className="mt-4 font-semibold">Quota Balances</h3>
      {client.quotas?.map((q: any, i: number) => (
        <div key={i} className="flex justify-between py-1">
          <span>{q.fuel_type}:</span>
          <span>
            {q.remaining_liters}L / {q.amount_liters}L
          </span>
        </div>
      ))}

      <h3 className="mt-4 font-semibold">Outstanding Balance</h3>
      <p className="text-2xl font-bold">
        ${client.outstanding_balance?.toFixed(2)}
      </p>
    </div>
  );
}