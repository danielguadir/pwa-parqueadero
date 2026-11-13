"use client";

import { useEffect, useState, useCallback } from "react";
import {
  syncPendingOperations,
  getPendingOperationsCount,
  getLastSyncedTime,
} from "./sync-client";

export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [databaseOnline, setDatabaseOnline] = useState<boolean>(true);

  const refreshCounts = useCallback(async () => {
    try {
      const count = await getPendingOperationsCount();
      const lastTime = await getLastSyncedTime();
      setPendingCount(count);
      setLastSyncedAt(lastTime);
    } catch {
      // Ignorar errores de lectura local transitorios
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (isSyncing || typeof navigator === "undefined" || !navigator.onLine) return;
    setIsSyncing(true);
    setLastError(null);

    try {
      const result = await syncPendingOperations();
      setDatabaseOnline(result.databaseOnline);
      if (result.failedCount > 0 && result.processedCount === 0) {
        setLastError(result.message ?? "No se pudo sincronizar.");
      }
      await refreshCounts();
    } catch (err) {
      setLastError(err instanceof Error ? err.message : "Error al sincronizar");
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshCounts]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        refreshCounts();
      }
    });

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Sondeo de cola cada 15 segundos
    const interval = setInterval(() => {
      refreshCounts();
      if (navigator.onLine && pendingCount > 0 && !isSyncing) {
        triggerSync();
      }
    }, 15000);

    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [pendingCount, isSyncing, refreshCounts, triggerSync]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncedAt,
    lastError,
    databaseOnline,
    triggerSync,
    refreshCounts,
  };
}
