import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-primary">Qadra Oil</h1>
      <p className="mt-4 text-muted-foreground">
        Fuel-quota and post-pay billing management
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/station" className="rounded-lg bg-primary px-6 py-3 text-primary-foreground">
          Station User
        </Link>
        <Link href="/admin" className="rounded-lg border px-6 py-3">
          Admin
        </Link>
      </div>
    </main>
  );
}
