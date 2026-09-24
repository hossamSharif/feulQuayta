import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <h1 className="text-4xl font-bold text-primary mb-8">Admin Dashboard</h1>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link href="/admin/overages" className="rounded-lg border p-4 text-center">
          Overage Requests
        </Link>
        <Link href="/admin/payments" className="rounded-lg border p-4 text-center">
          Payments
        </Link>
        <Link href="/admin/quota-reset" className="rounded-lg border p-4 text-center">
          Quota Reset
        </Link>
        <Link href="/admin/reports" className="rounded-lg border p-4 text-center">
          Reports
        </Link>
        <Link href="/admin/quotas" className="rounded-lg border p-4 text-center">
          Quota Management
        </Link>
      </div>
    </main>
  );
}
