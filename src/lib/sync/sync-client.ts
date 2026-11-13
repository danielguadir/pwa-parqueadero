import { getLocalDb, getOrCreateDeviceId } from "@/types/../lib/db/local-db";
import type {
  SyncBatchRequest,
  SyncBatchResponse,
} from "@/types/parking";

export interface ClientSyncResult {
  attempted: number;
  processedCount: number;
  failedCount: number;
  databaseOnline: boolean;
  message?: string;
}

/**
 * Cliente de sincronización offline -> online.
 * Procesa la cola de operaciones pendientes de forma atómica e idempotente.
 */
export async function syncPendingOperations(): Promise<ClientSyncResult> {
  if (typeof window === "undefined") {
    return { attempted: 0, processedCount: 0, failedCount: 0, databaseOnline: false };
  }

  // Si el navegador reporta estar offline, abortar de inmediato sin generar errores de red
  if (!navigator.onLine) {
    return {
      attempted: 0,
      processedCount: 0,
      failedCount: 0,
      databaseOnline: false,
      message: "Dispositivo sin conexión a internet.",
    };
  }

  const db = getLocalDb();
  const deviceId = getOrCreateDeviceId();

  // Obtener operaciones pendientes ordenadas por fecha de creación
  const pending = await db.pendingOperations
    .where("state")
    .equals("PENDING")
    .sortBy("createdAt");

  if (pending.length === 0) {
    return {
      attempted: 0,
      processedCount: 0,
      failedCount: 0,
      databaseOnline: true,
      message: "Todas las operaciones están al día.",
    };
  }

  // Tomar lote de hasta 50 operaciones para evitar sobrecargar la red móvil
  const batch = pending.slice(0, 50);
  const payload: SyncBatchRequest = {
    deviceId,
    operations: batch,
  };

  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`El servidor de sincronización respondió con HTTP ${response.status}`);
    }

    const data: SyncBatchResponse = await response.json();

    // Actualizar estado de las operaciones reconocidas por el servidor
    const processedSet = new Set(data.processed);

    await db.transaction("rw", [db.pendingOperations, db.sessions, db.payments, db.configs], async () => {
      for (const op of batch) {
        if (processedSet.has(op.id)) {
          // Marcar operación como confirmada
          await db.pendingOperations.update(op.id, { state: "CONFIRMED" });

          const payload = op.payload as { sessionId?: string; paymentId?: string };

          // Actualizar estado de sincronización en la sesión o pago correspondiente
          if (payload.sessionId) {
            await db.sessions.update(payload.sessionId, { syncState: "CONFIRMED" });
          }
          if (payload.paymentId) {
            await db.payments.update(payload.paymentId, { syncState: "CONFIRMED" });
          }
        }
      }

      // Guardar marca de tiempo de última sincronización
      await db.configs.put({
        key: "last_sync_timestamp",
        value: data.serverTime || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    return {
      attempted: batch.length,
      processedCount: data.processed.length,
      failedCount: data.failed?.length ?? 0,
      databaseOnline: data.databaseOnline,
      message: data.message,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de red desconocido al sincronizar";
    console.warn("[SyncEngine] Fallo intento de sincronización:", message);
    return {
      attempted: batch.length,
      processedCount: 0,
      failedCount: batch.length,
      databaseOnline: false,
      message,
    };
  }
}

/**
 * Consulta la cantidad actual de operaciones en cola pendientes de sincronizar.
 */
export async function getPendingOperationsCount(): Promise<number> {
  if (typeof window === "undefined") return 0;
  const db = getLocalDb();
  return db.pendingOperations.where("state").equals("PENDING").count();
}

/**
 * Obtiene la fecha y hora de la última sincronización exitosa.
 */
export async function getLastSyncedTime(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const db = getLocalDb();
  const cfg = await db.configs.get("last_sync_timestamp");
  if (!cfg) return null;
  return typeof cfg.value === "string" ? cfg.value : null;
}
