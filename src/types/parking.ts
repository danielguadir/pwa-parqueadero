// Contratos y modelos de dominio para ParkingControl
export type VehicleCategory = "CAR" | "MOTORCYCLE" | "OTHER";
export type ParkingSessionState = "OPEN" | "CLOSED" | "CANCELLED";
export type SyncState = "PENDING" | "SENDING" | "CONFIRMED" | "CONFLICT" | "FAILED";

export interface ParkingSessionSummary {
  id: string;
  parkingLotId: string;
  plateNormalized: string;
  vehicleCategory: VehicleCategory;
  enteredAt: string; // UTC ISO-8601
  exitedAt: string | null;
  state: ParkingSessionState;
}

export interface LocalParkingSession {
  id: string;                     // UUID v4 único
  parkingLotId: string;
  plateNormalized: string;        // Placa en mayúsculas sin espacios ni caracteres especiales
  vehicleCategory: VehicleCategory;
  enteredAt: string;              // ISO-8601 UTC
  exitedAt: string | null;
  status: ParkingSessionState;
  notes?: string;
  tariffId?: string;
  totalCents?: number | null;
  syncState: SyncState;
  createdAt: string;              // ISO-8601 UTC
  updatedAt: string;              // ISO-8601 UTC
}

export interface LocalVehicle {
  plateNormalized: string;
  type: VehicleCategory;
  createdAt: string;
  lastEnteredAt: string;
  totalVisits?: number;
}

export interface PendingOperation {
  id: string;                     // UUID único; evita duplicados al reintentar (idempotencia)
  deviceId: string;
  operationType: "OPEN_SESSION" | "CLOSE_SESSION" | "REGISTER_PAYMENT";
  payload: unknown;
  state: SyncState;
  createdAt: string;              // ISO-8601 UTC
  retries?: number;
  lastError?: string;
}

export interface LocalParkingConfig {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
}

export interface OccupancyStats {
  carOccupied: number;
  carCapacity: number;
  motorcycleOccupied: number;
  motorcycleCapacity: number;
  otherOccupied: number;
  totalOccupied: number;
  totalCapacity: number;
}

export interface EntryValidationResult {
  isValid: boolean;
  normalizedPlate: string;
  suggestedType: VehicleCategory;
  error?: string;
}

export interface RegisterEntryInput {
  plate: string;
  vehicleCategory: VehicleCategory;
  notes?: string;
  parkingLotId?: string;
}
