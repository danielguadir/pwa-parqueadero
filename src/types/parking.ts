// Contratos y modelos de dominio para ParkingControl
export type VehicleCategory = "CAR" | "MOTORCYCLE" | "OTHER";
export type ParkingSessionState = "OPEN" | "CLOSED" | "CANCELLED";
export type SyncState = "PENDING" | "SENDING" | "CONFIRMED" | "CONFLICT" | "FAILED";

export type ParkingZone =
  | "ZONA_NORTE"
  | "ZONA_SUR"
  | "ZONA_ORIENTE"
  | "ZONA_OCCIDENTE"
  | "ZONA_CENTRAL_A"
  | "ZONA_CENTRAL_B";

export const PARKING_ZONES: { id: ParkingZone; label: string; short: string }[] = [
  { id: "ZONA_CENTRAL_A", label: "Zona Central A", short: "Central A" },
  { id: "ZONA_CENTRAL_B", label: "Zona Central B", short: "Central B" },
  { id: "ZONA_NORTE", label: "Zona Norte", short: "Norte" },
  { id: "ZONA_SUR", label: "Zona Sur", short: "Sur" },
  { id: "ZONA_ORIENTE", label: "Zona Oriente", short: "Oriente" },
  { id: "ZONA_OCCIDENTE", label: "Zona Occidente", short: "Occidente" },
];

export type PaymentMethod = "CASH" | "NEQUI_DAVIPLATA" | "CARD" | "OTHER";

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: "CASH", label: "Efectivo", icon: "💵" },
  { id: "NEQUI_DAVIPLATA", label: "Nequi / Daviplata", icon: "📱" },
  { id: "CARD", label: "Tarjeta / Datáfono", icon: "💳" },
  { id: "OTHER", label: "Otro / Bono", icon: "🏷️" },
];

export interface LocalParkingSession {
  id: string;                     // UUID v4 único
  parkingLotId: string;
  plateNormalized: string;        // Placa en mayúsculas sin espacios
  vehicleCategory: VehicleCategory;
  zone?: ParkingZone;             // Zona física de parqueo asignada
  enteredAt: string;              // ISO-8601 UTC
  exitedAt: string | null;        // ISO-8601 UTC al cerrar
  status: ParkingSessionState;
  notes?: string;
  tariffId?: string;
  totalCents?: number | null;     // Valor cobrado en pesos/unidades enteras
  paymentId?: string;
  syncState: SyncState;
  createdAt: string;              // ISO-8601 UTC
  updatedAt: string;              // ISO-8601 UTC
}

export interface LocalPayment {
  id: string;                     // UUID v4 único
  sessionId: string;
  plateNormalized: string;
  amountCents: number;            // Monto en COP
  method: PaymentMethod;
  operatorId: string;
  operationId: string;            // Para idempotencia en sincronización
  createdAt: string;              // ISO-8601 UTC
  syncState: SyncState;
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

export interface TariffConfig {
  carHourlyRate: number;          // Tarifa hora carro en COP (ej: 3500)
  motorcycleHourlyRate: number;   // Tarifa hora moto en COP (ej: 1800)
  otherHourlyRate: number;        // Tarifa otros (ej: 4500)
  gracePeriodMinutes: number;     // Minutos de cortesía/gracia sin costo (ej: 10)
  chargeFractionAfterHour: boolean; // Si fracciona tras la primera hora
  fractionBlockMinutes: number;   // Bloque de fracción en minutos (ej: 15)
}

export interface FeeCalculationResult {
  totalMinutes: number;
  billableMinutes: number;
  amountDue: number;              // En COP entero
  isGracePeriod: boolean;
  breakdown: string;
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
  zone?: ParkingZone;
  notes?: string;
  parkingLotId?: string;
}

export interface CloseSessionInput {
  sessionId: string;
  paymentMethod: PaymentMethod;
  discountCents?: number;
  notes?: string;
  operatorId?: string;
}

export interface DailyBillingSummary {
  date: string;
  totalRevenue: number;
  totalCompletedSessions: number;
  cashRevenue: number;
  transferRevenue: number;
  cardRevenue: number;
  otherRevenue: number;
}
