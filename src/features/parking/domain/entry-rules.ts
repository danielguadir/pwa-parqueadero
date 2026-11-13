import type {
  LocalParkingSession,
  PendingOperation,
  RegisterEntryInput,
  OccupancyStats,
} from "@/types/parking";
import { validatePlate } from "./plate-validator.ts";

export interface CanRegisterEntryResult {
  canRegister: boolean;
  reason?: string;
  normalizedPlate: string;
}

/**
 * Valida si un vehículo puede ingresar al parqueadero considerando:
 * 1. Formato de placa válido.
 * 2. Si ya tiene una estancia activa (vehículo aún dentro).
 * 3. Si hay cupos disponibles según la capacidad.
 */
export function canRegisterEntry(
  input: RegisterEntryInput,
  hasActiveSession: boolean,
  stats?: OccupancyStats
): CanRegisterEntryResult {
  const validation = validatePlate(input.plate);
  if (!validation.isValid) {
    return {
      canRegister: false,
      reason: validation.error ?? "Placa inválida.",
      normalizedPlate: validation.normalizedPlate,
    };
  }

  if (hasActiveSession) {
    return {
      canRegister: false,
      reason: `El vehículo con placa ${validation.normalizedPlate} ya tiene una estancia abierta dentro del parqueadero.`,
      normalizedPlate: validation.normalizedPlate,
    };
  }

  if (stats) {
    if (input.vehicleCategory === "CAR" && stats.carCapacity > 0 && stats.carOccupied >= stats.carCapacity) {
      return {
        canRegister: false,
        reason: `Capacidad máxima alcanzada para automóviles (${stats.carOccupied}/${stats.carCapacity} cupos).`,
        normalizedPlate: validation.normalizedPlate,
      };
    }
    if (input.vehicleCategory === "MOTORCYCLE" && stats.motorcycleCapacity > 0 && stats.motorcycleOccupied >= stats.motorcycleCapacity) {
      return {
        canRegister: false,
        reason: `Capacidad máxima alcanzada para motocicletas (${stats.motorcycleOccupied}/${stats.motorcycleCapacity} cupos).`,
        normalizedPlate: validation.normalizedPlate,
      };
    }
    if (stats.totalCapacity > 0 && stats.totalOccupied >= stats.totalCapacity) {
      return {
        canRegister: false,
        reason: `El parqueadero ha alcanzado su capacidad total permitida (${stats.totalOccupied}/${stats.totalCapacity}).`,
        normalizedPlate: validation.normalizedPlate,
      };
    }
  }

  return {
    canRegister: true,
    normalizedPlate: validation.normalizedPlate,
  };
}

/**
 * Crea la entidad de sesión de parqueo y la operación de sincronización en cola.
 */
export function buildEntryEntities(
  input: RegisterEntryInput,
  deviceId: string,
  nowUtc: Date = new Date()
): { session: LocalParkingSession; operation: PendingOperation } {
  const sessionId = crypto.randomUUID();
  const operationId = crypto.randomUUID();
  const isoDate = nowUtc.toISOString();
  const plateNormalized = input.plate.trim().toUpperCase().replace(/[\s\-_.]/g, "");
  const parkingLotId = input.parkingLotId ?? "default-lot";
  const zone = input.zone ?? "ZONA_CENTRAL_A";

  const session: LocalParkingSession = {
    id: sessionId,
    parkingLotId,
    plateNormalized,
    vehicleCategory: input.vehicleCategory,
    zone,
    enteredAt: isoDate,
    exitedAt: null,
    status: "OPEN",
    notes: input.notes?.trim() || undefined,
    syncState: "PENDING",
    createdAt: isoDate,
    updatedAt: isoDate,
  };

  const operation: PendingOperation = {
    id: operationId,
    deviceId,
    operationType: "OPEN_SESSION",
    payload: {
      sessionId,
      parkingLotId,
      plateNormalized,
      vehicleCategory: input.vehicleCategory,
      zone,
      enteredAt: isoDate,
      notes: input.notes?.trim() || undefined,
    },
    state: "PENDING",
    createdAt: isoDate,
    retries: 0,
  };

  return { session, operation };
}
