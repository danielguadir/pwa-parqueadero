"use client";

import { useEffect, useState } from "react";

export function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5">
          {isOnline ? (
            <>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
          )}
        </span>

        {isOnline ? (
          <span className="font-semibold text-emerald-300">
            🟢 En línea · Almacenamiento local activo en este dispositivo
          </span>
        ) : (
          <span className="font-semibold text-amber-300">
            🟠 Sin internet (Modo Offline) · Todos los registros se guardan seguros en este dispositivo
          </span>
        )}
      </div>

      <div className="hidden sm:block text-[11px] text-slate-400">
        PWA Offline-First · Evento 2 Días
      </div>
    </div>
  );
}
