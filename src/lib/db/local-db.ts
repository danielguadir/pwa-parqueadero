import Dexie, { type Table } from "dexie";
import type { SyncState } from "@/types/parking";

export interface PendingOperation {
  id: string;              // UUID único; evita duplicados al reintentar
  deviceId: string;
  operationType: "OPEN_SESSION" | "CLOSE_SESSION" | "REGISTER_PAYMENT";
  payload: unknown;
  state: SyncState;
  createdAt: string;       // ISO-8601 UTC
}

// Importar este módulo ÚNICAMENTE desde componentes/servicios del navegador.
// Es la estructura inicial de almacenamiento, NO un sincronizador implementado.
class ParkingLocalDb extends Dexie {
  pendingOperations!: Table<PendingOperation, string>;
  constructor() {
    super("ParkingControlLocal");
    this.version(1).stores({ pendingOperations: "id,deviceId,operationType,state,createdAt" });
  }
}
export function createLocalDb() { return new ParkingLocalDb(); }
