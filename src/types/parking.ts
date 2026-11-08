// Contratos iniciales. Se ampliarán junto con los endpoints reales.
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
