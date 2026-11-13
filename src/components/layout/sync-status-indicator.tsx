"use client";

import { useSyncStatus } from "@/lib/sync/use-sync-status";

export function SyncStatusIndicator() {
  const { isOnline, isSyncing, pendingCount, lastSyncedAt, triggerSync } = useSyncStatus();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs shadow-sm backdrop-blur">
      <div className="flex items-center gap-2">
        {/* Indicador de Red */}
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

        {/* Texto de Estado */}
        {!isOnline ? (
          <span className="font-medium text-amber-300">
            Modo Offline activo · Datos protegidos en dispositivo
          </span>
        ) : isSyncing ? (
          <span className="flex items-center gap-1 font-medium text-teal-300">
            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Sincronizando con servidor...
          </span>
        ) : pendingCount > 0 ? (
          <span className="font-medium text-amber-200">
            ⏳ {pendingCount} {pendingCount === 1 ? "registro pendiente" : "registros pendientes"} de subir
          </span>
        ) : (
          <span className="font-medium text-emerald-300">
            🟢 En línea · Servidor sincronizado
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {lastSyncedAt && (
          <span className="hidden text-[11px] text-slate-400 sm:inline">
            Última sinc: {new Date(lastSyncedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}

        {isOnline && (
          <button
            type="button"
            onClick={triggerSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1 rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-1 text-[11px] font-semibold text-teal-300 transition hover:bg-teal-500/20 active:scale-95 disabled:opacity-50"
            title="Forzar comprobación y sincronización de datos con el servidor"
          >
            {isSyncing ? "Subiendo..." : pendingCount > 0 ? "Subir ahora" : "Comprobar"}
          </button>
        )}
      </div>
    </div>
  );
}
