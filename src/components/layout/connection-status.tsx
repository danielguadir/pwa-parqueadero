"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils/cn";

function suscribir(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

const estadoCliente = () => navigator.onLine;
const estadoServidor = () => true;

/**
 * Indicador compacto de conexión. Aclara que los datos se guardan
 * localmente en el dispositivo, haya o no internet.
 */
export function ConnectionStatus() {
  const enLinea = useSyncExternalStore(suscribir, estadoCliente, estadoServidor);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        enLinea ? "border-success/30 bg-success-soft text-success" : "border-warning/30 bg-warning-soft text-warning"
      )}
      title="Los registros se guardan en este dispositivo"
    >
      <span className={cn("h-2 w-2 rounded-full", enLinea ? "bg-success" : "bg-warning")} />
      {enLinea ? "En línea" : "Sin internet"}
      <span className="hidden sm:inline">· guardado local</span>
    </span>
  );
}
