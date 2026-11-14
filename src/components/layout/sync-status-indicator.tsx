"use client";

import { useSyncExternalStore } from "react";

function subscribeOnline(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getServerSnapshot() {
  return true;
}

export function SyncStatusIndicator() {
  const isOnline = useSyncExternalStore(subscribeOnline, getSnapshot, getServerSnapshot);

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
