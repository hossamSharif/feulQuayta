import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect based on role
      if (profile.role === 'admin') {
        router.push('/admin');
      } else if (profile.role === 'station_user') {
        router.push('/station');
      }
    }
  }, [loading, user, profile, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">Qadra Oil</h1>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">Qadra Oil</h1>
          <p className="mt-4 text-muted-foreground">
            Fuel-quota and post-pay billing management
          </p>
          <div className="mt-8">
            <Link
              href="/auth/login"
              className="rounded-lg bg-primary px-6 py-3 text-primary-foreground"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // If we have user but no profile yet, show loading
  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">Qadra Oil</h1>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </main>
    );
  }

  // Authenticated user sees dashboard links
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-primary">Qadra Oil</h1>
      <p className="mt-4 text-muted-foreground">
        Fuel-quota and post-pay billing management
      </p>
      <div className="mt-8 flex gap-4">
        {profile.role === 'admin' && (
          <>
            <Link
              href="/admin"
              className="rounded-lg border px-6 py-3"
            >
              Admin Dashboard
            </Link>
            <Link
              href="/station"
              className="rounded-lg border px-6 py-3"
            >
              Station Dashboard
            </Link>
          </>
        )}
        {profile.role === 'station_user' && (
          <Link
            href="/station"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground"
          >
            Station Dashboard
          </Link>
        )}
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Signed in as {profile.role === 'admin' ? 'Administrator' : 'Station User'}
        </p>
        <button
          onClick(async () => {
            // Import action dynamically to avoid circular dependencies
            const { logoutUser } = await import('@/actions/authActions');
            await logoutUser();
            router.push('/auth/login');
          })
          className="text-sm text-muted-foreground hover:underline"
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}