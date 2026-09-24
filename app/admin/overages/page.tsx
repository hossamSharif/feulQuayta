import Link from "next/link";

export default function OveragesPage() {
  return (
    <main className="flex min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-4">Overage Requests</h1>
        <p className="text-muted-foreground mb-6">
          Review pending overage requests created when fill-ups exceed quota.
        </p>
        <Link href="/admin" className="text-primary underline">Back to Dashboard</Link>
      </div>
    </main>
  );
}
