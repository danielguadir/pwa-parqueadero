import { getLocalDb, getOrCreateDeviceId } from "@/lib/db/local-db";
import type {
  LocalParkingSession,
  LocalPayment,
  TariffConfig,
  FeeCalculationResult,
  CloseSessionInput,
  DailyBillingSummary,
  PendingOperation,
} from "@/types/parking";
import { DEFAULT_TARIFF_CONFIG, calculateParkingFee } from "../domain/tariff-calculator";

/**
 * Obtiene la configuración de tarifas almacenada localmente o los valores predeterminados.
 */
export async function getTariffConfig(): Promise<TariffConfig> {
  const db = getLocalDb();
  const conf = await db.configs.get("tariff_config");
  if (conf && typeof conf.value === "object" && conf.value !== null) {
    return { ...DEFAULT_TARIFF_CONFIG, ...(conf.value as Partial<TariffConfig>) };
  }
  return DEFAULT_TARIFF_CONFIG;
}

/**
 * Guarda la configuración de tarifas en IndexedDB.
 */
export async function saveTariffConfig(config: TariffConfig): Promise<void> {
  const db = getLocalDb();
  await db.configs.put({ key: "tariff_config", value: config as unknown as Record<string, unknown> });
}

/**
 * Calcula el valor a pagar en tiempo real para una sesión activa.
 */
export async function previewSessionFee(session: LocalParkingSession, exitTimeIso: string = new Date().toISOString()): Promise<FeeCalculationResult> {
  const config = await getTariffConfig();
  return calculateParkingFee(session.enteredAt, exitTimeIso, session.vehicleCategory, config);
}

/**
 * Cierra de forma atómica y transaccional la estancia de un vehículo,
 * registra el pago y encola las operaciones de sincronización.
 */
export async function processExitAndPayment(
  input: CloseSessionInput
): Promise<{
  success: boolean;
  session?: LocalParkingSession;
  payment?: LocalPayment;
  fee?: FeeCalculationResult;
  error?: string;
}> {
  const db = getLocalDb();
  const session = await db.sessions.get(input.sessionId);

  if (!session) {
    return { success: false, error: "Estancia no encontrada en el dispositivo." };
  }

  if (session.status !== "OPEN") {
    return { success: false, error: `La estancia ya se encuentra finalizada (${session.status}).` };
  }

  const exitTimeIso = new Date().toISOString();
  const fee = await previewSessionFee(session, exitTimeIso);

  const discount = Math.max(0, input.discountCents ?? 0);
  const finalAmount = Math.max(0, fee.amountDue - discount);

  const paymentId = crypto.randomUUID();
  const operationCloseId = crypto.randomUUID();
  const operationPaymentId = crypto.randomUUID();
  const deviceId = getOrCreateDeviceId();

  const payment: LocalPayment = {
    id: paymentId,
    sessionId: session.id,
    plateNormalized: session.plateNormalized,
    amountCents: finalAmount,
    method: input.paymentMethod,
    operatorId: input.operatorId ?? "local-operator",
    operationId: operationPaymentId,
    createdAt: exitTimeIso,
    syncState: "PENDING",
  };

  const updatedSession: LocalParkingSession = {
    ...session,
    exitedAt: exitTimeIso,
    status: "CLOSED",
    totalCents: finalAmount,
    paymentId: payment.id,
    notes: input.notes ? `${session.notes ? session.notes + " | " : ""}${input.notes}` : session.notes,
    syncState: "PENDING",
    updatedAt: exitTimeIso,
  };

  const opClose: PendingOperation = {
    id: operationCloseId,
    deviceId,
    operationType: "CLOSE_SESSION",
    payload: {
      sessionId: session.id,
      plateNormalized: session.plateNormalized,
      exitedAt: exitTimeIso,
      totalCents: finalAmount,
    },
    state: "PENDING",
    createdAt: exitTimeIso,
    retries: 0,
  };

  const opPayment: PendingOperation = {
    id: operationPaymentId,
    deviceId,
    operationType: "REGISTER_PAYMENT",
    payload: {
      paymentId: payment.id,
      sessionId: session.id,
      plateNormalized: session.plateNormalized,
      amountCents: finalAmount,
      method: input.paymentMethod,
      createdAt: exitTimeIso,
    },
    state: "PENDING",
    createdAt: exitTimeIso,
    retries: 0,
  };

  await db.transaction("rw", [db.sessions, db.payments, db.pendingOperations], async () => {
    // 1. Actualizar estado de la sesión
    await db.sessions.put(updatedSession);

    // 2. Insertar registro de pago
    await db.payments.add(payment);

    // 3. Encolar ambas operaciones para la sincronización futura
    await db.pendingOperations.add(opClose);
    await db.pendingOperations.add(opPayment);
  });

  return {
    success: true,
    session: updatedSession,
    payment,
    fee,
  };
}

/**
 * Obtiene el resumen de arqueo de caja y facturación para una fecha específica (por defecto hoy).
 */
export async function getDailyBillingSummary(targetDate: Date = new Date()): Promise<DailyBillingSummary> {
  const db = getLocalDb();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const startIso = startOfDay.toISOString();
  const endIso = endOfDay.toISOString();

  const payments = await db.payments
    .where("createdAt")
    .between(startIso, endIso, true, true)
    .toArray();

  let totalRevenue = 0;
  let cashRevenue = 0;
  let transferRevenue = 0;
  let cardRevenue = 0;
  let otherRevenue = 0;

  for (const p of payments) {
    totalRevenue += p.amountCents;
    if (p.method === "CASH") cashRevenue += p.amountCents;
    else if (p.method === "NEQUI_DAVIPLATA") transferRevenue += p.amountCents;
    else if (p.method === "CARD") cardRevenue += p.amountCents;
    else otherRevenue += p.amountCents;
  }

  return {
    date: startOfDay.toLocaleDateString("es-CO"),
    totalRevenue,
    totalCompletedSessions: payments.length,
    cashRevenue,
    transferRevenue,
    cardRevenue,
    otherRevenue,
  };
}

/**
 * Consulta el historial unificado de estancias con soporte para filtros.
 */
export async function getHistoricalSessions(filter?: {
  plate?: string;
  status?: string;
  category?: string;
}): Promise<LocalParkingSession[]> {
  const db = getLocalDb();
  const allSessions = await db.sessions.reverse().sortBy("enteredAt");

  return allSessions.filter((s) => {
    if (filter?.plate && !s.plateNormalized.includes(filter.plate.trim().toUpperCase())) {
      return false;
    }
    if (filter?.status && filter.status !== "ALL" && s.status !== filter.status) {
      return false;
    }
    if (filter?.category && filter.category !== "ALL" && s.vehicleCategory !== filter.category) {
      return false;
    }
    return true;
  });
}
