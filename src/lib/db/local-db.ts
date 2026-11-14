import Dexie, { type Table } from "dexie";
import type { MovimientoParqueadero } from "../../types/movimiento.ts";

/**
 * Base de datos local (IndexedDB vía Dexie).
 *
 * Las versiones 1-4 pertenecen al prototipo anterior. Se conservan sus
 * definiciones para que los navegadores que ya tengan datos migren de forma
 * segura sin perder información. La aplicación actual solo usa las tablas
 * `movimientos` y `configuracion`.
 */
const ESQUEMA_PROTOTIPO = {
  pendingOperations: "id,deviceId,operationType,state,createdAt",
  sessions: "id, plateNormalized, status, [plateNormalized+status], vehicleCategory, zone, enteredAt, exitedAt, syncState",
  vehicles: "plateNormalized, type, lastEnteredAt",
  payments: "id, sessionId, plateNormalized, method, createdAt, syncState",
  operators: "id, name, role, isActive, document",
  configs: "key",
};

export class ParkingLocalDb extends Dexie {
  movimientos!: Table<MovimientoParqueadero, string>;
  configuracion!: Table<{ clave: string; valor: unknown }, string>;

  constructor() {
    super("ParkingControlLocal");

    this.version(1).stores({
      pendingOperations: ESQUEMA_PROTOTIPO.pendingOperations,
    });
    this.version(2).stores({
      pendingOperations: ESQUEMA_PROTOTIPO.pendingOperations,
      sessions: "id, plateNormalized, status, [plateNormalized+status], vehicleCategory, enteredAt, syncState",
      vehicles: ESQUEMA_PROTOTIPO.vehicles,
      configs: ESQUEMA_PROTOTIPO.configs,
    });
    this.version(3).stores({
      pendingOperations: ESQUEMA_PROTOTIPO.pendingOperations,
      sessions: ESQUEMA_PROTOTIPO.sessions,
      vehicles: ESQUEMA_PROTOTIPO.vehicles,
      payments: ESQUEMA_PROTOTIPO.payments,
      configs: ESQUEMA_PROTOTIPO.configs,
    });
    this.version(4).stores(ESQUEMA_PROTOTIPO);

    // Versión 5: modelo actual de movimientos del evento.
    this.version(5).stores({
      ...ESQUEMA_PROTOTIPO,
      movimientos:
        "id, placaNormalizada, tipoVehiculo, nombreNormalizado, cedula, estadoVehiculo, estadoPago, fechaIngreso, [estadoVehiculo+placaNormalizada]",
      configuracion: "clave",
    });
  }
}

let dbInstance: ParkingLocalDb | null = null;

/** Devuelve la instancia única de la base de datos local. */
export function getLocalDb(): ParkingLocalDb {
  if (typeof window === "undefined") {
    // Durante el prerender en servidor no existe IndexedDB; se crea una instancia inerte.
    return new ParkingLocalDb();
  }
  if (!dbInstance) {
    dbInstance = new ParkingLocalDb();
  }
  return dbInstance;
}
