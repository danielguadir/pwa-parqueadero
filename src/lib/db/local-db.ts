import Dexie, { type Table } from "dexie";
import type {
  LocalParkingSession,
  LocalVehicle,
  LocalPayment,
  PendingOperation,
  LocalParkingConfig,
} from "@/types/parking";

export class ParkingLocalDb extends Dexie {
  sessions!: Table<LocalParkingSession, string>;
  vehicles!: Table<LocalVehicle, string>;
  payments!: Table<LocalPayment, string>;
  pendingOperations!: Table<PendingOperation, string>;
  configs!: Table<LocalParkingConfig, string>;

  constructor() {
    super("ParkingControlLocal");

    // Esquema versión 1 (base inicial previa)
    this.version(1).stores({
      pendingOperations: "id,deviceId,operationType,state,createdAt",
    });

    // Esquema versión 2: soporte para sesiones, vehículos y configuración local
    this.version(2).stores({
      pendingOperations: "id,deviceId,operationType,state,createdAt",
      sessions: "id, plateNormalized, status, [plateNormalized+status], vehicleCategory, enteredAt, syncState",
      vehicles: "plateNormalized, type, lastEnteredAt",
      configs: "key",
    });

    // Esquema versión 3: soporte para salidas, pagos, zonas y reportes de facturación
    this.version(3).stores({
      pendingOperations: "id,deviceId,operationType,state,createdAt",
      sessions: "id, plateNormalized, status, [plateNormalized+status], vehicleCategory, zone, enteredAt, exitedAt, syncState",
      vehicles: "plateNormalized, type, lastEnteredAt",
      payments: "id, sessionId, plateNormalized, method, createdAt, syncState",
      configs: "key",
    });
  }
}

// Singleton en memoria para el navegador
let dbInstance: ParkingLocalDb | null = null;

export function getLocalDb(): ParkingLocalDb {
  if (typeof window === "undefined") {
    // Entorno de servidor: instanciación segura para evitar excepciones durante SSR
    return new ParkingLocalDb();
  }
  if (!dbInstance) {
    dbInstance = new ParkingLocalDb();
  }
  return dbInstance;
}

/**
 * Obtiene o inicializa un UUID persistente para este navegador/dispositivo.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") {
    return "server-node-device";
  }
  const KEY = "parking_device_id_v1";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
