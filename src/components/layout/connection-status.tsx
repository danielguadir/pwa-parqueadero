"use client";

import { useSyncExternalStore, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { sincronizarConServidor } from "@/features/parking/services/movimientos-service";

function suscribir(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

const estadoCliente = () => (typeof navigator !== "undefined" ? navigator.onLine : true);
const estadoServidor = () => true;

/**
 * Indicador interactivo de conexión y sincronización.
 * Permite pulsar para forzar sincronización entre celular y computador.
 */
export function ConnectionStatus() {
  const enLinea = useSyncExternalStore(suscribir, estadoCliente, estadoServidor);
  const [sincronizando, setSincronizando] = useState(false);

  const handleManualSync = async () => {
    if (sincronizando) return;
    setSincronizando(true);
    try {
      await sincronizarConServidor();
    } finally {
      setTimeout(() => setSincronizando(false), 800);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleManualSync}
        disabled={sincronizando}
        title="Toca para sincronizar los registros entre el celular y el computador"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition touch-manipulation active:scale-95",
          enLinea
            ? "border-primary/30 bg-primary-soft text-primary-strong hover:bg-primary-soft/80"
            : "border-warning/30 bg-warning-soft text-warning"
        )}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            sincronizando ? "animate-ping bg-primary" : enLinea ? "bg-success" : "bg-warning"
          )}
        />
        <span>
          {sincronizando
            ? "Sincronizando..."
            : enLinea
            ? "En línea · ↻ Sincronizar"
            : "Sin internet (Modo Offline)"}
        </span>
      </button>
    </div>
  );
}
