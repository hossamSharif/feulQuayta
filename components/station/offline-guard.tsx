"use client";

import { useEffect, useState } from "react";
import { isNetworkWideClient } from "@/lib/offline-write-queue";

interface OfflineGuardProps {
  children: React.ReactNode;
  clientScope: "single_station" | "network_wide" | null;
  isClientOnline: boolean;
}

export function OfflineGuard({
  children,
  clientScope,
  isClientOnline,
}: OfflineGuardProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isQueued, setIsQueued] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const networkWideOffline =
    !isOnline && clientScope === "network_wide";
  const singleStationOffline = !isOnline && clientScope === "single_station";

  if (networkWideOffline) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <div className="rounded-lg border bg-destructive/10 p-6 text-center max-w-md">
          <h2 className="text-xl font-bold text-destructive mb-2">
            Connection Required
          </h2>
          <p className="text-muted-foreground">
            Network-wide clients cannot record fill-ups offline. Please
            reconnect to the internet to process transactions.
          </p>
        </div>
      </div>
    );
  }

  if (singleStationOffline) {
    setIsQueued(true);
  }

  return (
    <>
      {isQueued && (
        <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg bg-secondary/90 p-4 text-center shadow-lg">
          <p className="text-sm font-medium">
            Offline mode — fill-up queued for sync when reconnected
          </p>
        </div>
      )}
      {children}
    </>
  );
}