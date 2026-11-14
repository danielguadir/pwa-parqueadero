import Dexie, { type Table } from "dexie";
import { generarUUID } from "../utils/uuid.ts";
import type {
  LocalParkingSession,
  LocalVehicle,
  LocalPayment,
  PendingOperation,
  LocalParkingConfig,
  AppOperator,
  ParkingSettings,
} from "../../types/parking.ts";
import type { MovimientoParqueadero } from "../../types/movimiento.ts";

export class ParkingLocalDb extends Dexie {
  sessions!: Table<LocalParkingSession, string>;
  vehicles!: Table<LocalVehicle, string>;
  payments!: Table<LocalPayment, string>;
  pendingOperations!: Table<PendingOperation, string>;
  operators!: Table<AppOperator, string>;
  configs!: Table<LocalParkingConfig, string>;
  movimientos!: Table<MovimientoParqueadero, string>;
  configuracion!: Table<{ clave: string; valor: unknown }, string>;

  constructor() {
    super("ParkingControlLocal");

    // Esquema versión 1
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

    // Esquema versión 4: soporte para operadores y control de roles offline
    this.version(4).stores({
      pendingOperations: "id,deviceId,operationType,state,createdAt",
      sessions: "id, plateNormalized, status, [plateNormalized+status], vehicleCategory, zone, enteredAt, exitedAt, syncState",
      vehicles: "plateNormalized, type, lastEnteredAt",
      payments: "id, sessionId, plateNormalized, method, createdAt, syncState",
      operators: "id, name, role, isActive, document",
      configs: "key",
    });

    // Esquema versión 5: Módulo unificado y optimizado de movimientos de parqueadero para eventos
    this.version(5).stores({
      pendingOperations: "id,deviceId,operationType,state,createdAt",
      sessions: "id, plateNormalized, status, [plateNormalized+status], vehicleCategory, zone, enteredAt, exitedAt, syncState",
      vehicles: "plateNormalized, type, lastEnteredAt",
      payments: "id, sessionId, plateNormalized, method, createdAt, syncState",
      operators: "id, name, role, isActive, document",
      configs: "key",
      movimientos: "id, placaNormalizada, tipoVehiculo, nombreNormalizado, cedula, estadoVehiculo, estadoPago, fechaIngreso, [estadoVehiculo+placaNormalizada]",
      configuracion: "clave",
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
    id = generarUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export const DEFAULT_PARKING_SETTINGS: ParkingSettings = {
  name: "ParkingControl Centro",
  nit: "900.123.456-7",
  phone: "310 000 0000",
  address: "Calle Principal # 10 - 20",
  carCapacity: 40,
  motorcycleCapacity: 30,
  receiptFooter: "Gracias por su visita. Conserve este comprobante para retirar su vehículo.",
};

/**
 * Obtiene la configuración general del parqueadero desde Dexie.
 */
export async function getParkingSettings(): Promise<ParkingSettings> {
  const db = getLocalDb();
  const config = await db.configs.get("parking_settings");
  if (!config) {
    return DEFAULT_PARKING_SETTINGS;
  }
  try {
    const parsed = typeof config.value === "string" ? JSON.parse(config.value) : config.value;
    return { ...DEFAULT_PARKING_SETTINGS, ...(parsed as Partial<ParkingSettings>) };
  } catch {
    return DEFAULT_PARKING_SETTINGS;
  }
}

/**
 * Guarda la configuración general del parqueadero en Dexie.
 */
export async function saveParkingSettings(settings: ParkingSettings): Promise<void> {
  const db = getLocalDb();
  await db.configs.put({
    key: "parking_settings",
    value: JSON.stringify(settings),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Asegura que exista al menos un operador por defecto en la base de datos local.
 */
export async function ensureInitialOperator(): Promise<AppOperator> {
  const db = getLocalDb();
  const count = await db.operators.count();
  if (count === 0) {
    const admin: AppOperator = {
      id: generarUUID(),
      name: "Administrador General",
      role: "ADMIN",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await db.operators.add(admin);
    return admin;
  }
  const first = await db.operators.toCollection().first();
  return first!;
}

/**
 * Obtiene el operador actualmente activo en el turno.
 */
export async function getActiveOperator(): Promise<AppOperator> {
  const db = getLocalDb();
  const saved = await db.configs.get("active_operator_id");
  if (saved && typeof saved.value === "string") {
    const op = await db.operators.get(saved.value);
    if (op && op.isActive) return op;
  }
  return ensureInitialOperator();
}

/**
 * Asigna el operador activo para el turno de trabajo.
 */
export async function setActiveOperator(operatorId: string): Promise<void> {
  const db = getLocalDb();
  await db.configs.put({
    key: "active_operator_id",
    value: operatorId,
    updatedAt: new Date().toISOString(),
  });
}
