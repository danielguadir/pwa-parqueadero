import { getLocalDb, getOrCreateDeviceId } from "@/lib/db/local-db";
import type {
  LocalParkingSession,
  RegisterEntryInput,
  OccupancyStats,
} from "@/types/parking";
import { normalizePlate } from "../domain/plate-validator";
import { canRegisterEntry, buildEntryEntities } from "../domain/entry-rules";

const DEFAULT_CAR_CAPACITY = 40;
const DEFAULT_MOTO_CAPACITY = 30;

/**
 * Obtiene la configuración de capacidad actual del parqueadero desde Dexie.
 */
export async function getParkingCapacities(): Promise<{ carCapacity: number; motorcycleCapacity: number; totalCapacity: number }> {
  const db = getLocalDb();
  const carConf = await db.configs.get("capacity_car");
  const motoConf = await db.configs.get("capacity_moto");

  const carCapacity = typeof carConf?.value === "number" ? carConf.value : DEFAULT_CAR_CAPACITY;
  const motorcycleCapacity = typeof motoConf?.value === "number" ? motoConf.value : DEFAULT_MOTO_CAPACITY;

  return {
    carCapacity,
    motorcycleCapacity,
    totalCapacity: carCapacity + motorcycleCapacity,
  };
}

/**
 * Actualiza las capacidades máximas configuradas para el parqueadero local.
 */
export async function setParkingCapacities(carCapacity: number, motorcycleCapacity: number): Promise<void> {
  const db = getLocalDb();
  await db.transaction("rw", db.configs, async () => {
    await db.configs.put({ key: "capacity_car", value: carCapacity });
    await db.configs.put({ key: "capacity_moto", value: motorcycleCapacity });
  });
}

/**
 * Calcula en tiempo real las estadísticas de ocupación y cupos disponibles.
 */
export async function getOccupancyStats(): Promise<OccupancyStats> {
  const db = getLocalDb();
  const capacities = await getParkingCapacities();

  const activeSessions = await db.sessions
    .where("status")
    .equals("OPEN")
    .toArray();

  let carOccupied = 0;
  let motorcycleOccupied = 0;
  let otherOccupied = 0;

  for (const session of activeSessions) {
    if (session.vehicleCategory === "CAR") carOccupied++;
    else if (session.vehicleCategory === "MOTORCYCLE") motorcycleOccupied++;
    else otherOccupied++;
  }

  const totalOccupied = carOccupied + motorcycleOccupied + otherOccupied;

  return {
    carOccupied,
    carCapacity: capacities.carCapacity,
    motorcycleOccupied,
    motorcycleCapacity: capacities.motorcycleCapacity,
    otherOccupied,
    totalOccupied,
    totalCapacity: capacities.totalCapacity,
  };
}

/**
 * Verifica si un vehículo con la placa dada ya se encuentra dentro del parqueadero.
 */
export async function isVehicleInside(rawPlate: string): Promise<boolean> {
  const db = getLocalDb();
  const plateNormalized = normalizePlate(rawPlate);
  if (!plateNormalized) return false;

  const existing = await db.sessions
    .where(["plateNormalized", "status"])
    .equals([plateNormalized, "OPEN"])
    .first();

  return Boolean(existing);
}

/**
 * Registra de forma transaccional e idempotente la entrada de un vehículo.
 * Guarda la sesión local, actualiza el registro de vehículo y añade la operación a la cola de sincronización.
 */
export async function registerEntry(
  input: RegisterEntryInput
): Promise<{ success: boolean; session?: LocalParkingSession; error?: string }> {
  const db = getLocalDb();
  const normalizedPlate = normalizePlate(input.plate);

  const deviceId = getOrCreateDeviceId();
  const stats = await getOccupancyStats();
  const hasActive = await isVehicleInside(normalizedPlate);

  const validation = canRegisterEntry(input, hasActive, stats);
  if (!validation.canRegister) {
    return {
      success: false,
      error: validation.reason,
    };
  }

  const { session, operation } = buildEntryEntities(
    { ...input, plate: normalizedPlate },
    deviceId
  );

  await db.transaction("rw", [db.sessions, db.vehicles, db.pendingOperations], async () => {
    // 1. Guardar sesión
    await db.sessions.add(session);

    // 2. Actualizar o crear registro histórico del vehículo
    const existingVehicle = await db.vehicles.get(normalizedPlate);
    if (existingVehicle) {
      await db.vehicles.update(normalizedPlate, {
        lastEnteredAt: session.enteredAt,
        type: session.vehicleCategory,
        totalVisits: (existingVehicle.totalVisits ?? 1) + 1,
      });
    } else {
      await db.vehicles.add({
        plateNormalized: normalizedPlate,
        type: session.vehicleCategory,
        createdAt: session.enteredAt,
        lastEnteredAt: session.enteredAt,
        totalVisits: 1,
      });
    }

    // 3. Registrar operación pendiente en cola de sincronización
    await db.pendingOperations.add(operation);
  });

  return {
    success: true,
    session,
  };
}

/**
 * Obtiene la lista de estancias activas actualmente dentro del parqueadero.
 */
export async function getActiveSessions(filterQuery?: string): Promise<LocalParkingSession[]> {
  const db = getLocalDb();
  const collection = db.sessions.where("status").equals("OPEN");

  const results = await collection.reverse().sortBy("enteredAt");

  if (filterQuery && filterQuery.trim()) {
    const q = filterQuery.trim().toUpperCase();
    return results.filter((s) => s.plateNormalized.includes(q));
  }

  return results;
}
