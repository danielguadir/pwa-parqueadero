import type {
  LocalParkingSession,
  LocalPayment,
  ReportPeriod,
  ConsolidatedReportMetrics,
} from "@/types/parking";

/**
 * Filtra sesiones según el periodo solicitado.
 */
export function filterSessionsByPeriod(
  sessions: LocalParkingSession[],
  period: ReportPeriod,
  now: Date = new Date()
): LocalParkingSession[] {
  if (period === "ALL") return sessions;

  const nowMs = now.getTime();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfDay - (now.getDay() === 0 ? 6 : now.getDay() - 1) * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  return sessions.filter((s) => {
    const sessionTime = new Date(s.exitedAt || s.enteredAt).getTime();

    switch (period) {
      case "TODAY":
        return sessionTime >= startOfDay && sessionTime <= nowMs;
      case "WEEK":
        return sessionTime >= startOfWeek && sessionTime <= nowMs;
      case "MONTH":
        return sessionTime >= startOfMonth && sessionTime <= nowMs;
      default:
        return true;
    }
  });
}

/**
 * Calcula métricas financieras consolidadas a partir de sesiones y pagos locales.
 */
export function calculateConsolidatedMetrics(
  sessions: LocalParkingSession[],
  payments: LocalPayment[],
  period: ReportPeriod = "TODAY"
): ConsolidatedReportMetrics {
  const sessionIds = new Set(sessions.map((s) => s.id));
  const relevantPayments = payments.filter((p) => sessionIds.has(p.sessionId));

  let totalRevenue = 0;
  let cashTotal = 0;
  let transferTotal = 0;
  let cardTotal = 0;
  let otherTotal = 0;

  for (const pay of relevantPayments) {
    const amount = pay.amountCents;
    totalRevenue += amount;

    switch (pay.method) {
      case "CASH":
        cashTotal += amount;
        break;
      case "NEQUI_DAVIPLATA":
        transferTotal += amount;
        break;
      case "CARD":
        cardTotal += amount;
        break;
      default:
        otherTotal += amount;
        break;
    }
  }

  // Si no hay pagos explícitos vinculados (ej. migraciones o pruebas), usar totalCents o agreedRate
  if (relevantPayments.length === 0 && sessions.length > 0) {
    for (const s of sessions) {
      if (s.status === "CLOSED" && typeof s.totalCents === "number") {
        totalRevenue += s.totalCents;
        cashTotal += s.totalCents; // default fallback
      }
    }
  }

  const completedSessions = sessions.filter((s) => s.status === "CLOSED");
  const totalSessions = completedSessions.length;
  const averageTicket = totalSessions > 0 ? Math.round(totalRevenue / totalSessions) : 0;

  let carCount = 0;
  let motoCount = 0;
  let otherCount = 0;

  for (const s of sessions) {
    if (s.vehicleCategory === "CAR") carCount++;
    else if (s.vehicleCategory === "MOTORCYCLE") motoCount++;
    else otherCount++;
  }

  return {
    period,
    totalRevenue,
    totalSessions,
    averageTicket,
    cashTotal,
    transferTotal,
    cardTotal,
    otherTotal,
    carCount,
    motoCount,
    otherCount,
  };
}

/**
 * Genera el texto CSV estándar del reporte consolidado.
 */
export function generateCsvReport(
  metrics: ConsolidatedReportMetrics,
  sessions: LocalParkingSession[]
): string {
  const lines: string[] = [];

  // Encabezado de métricas generales
  lines.push(`"Reporte Consolidado ParkingControl - Periodo: ${metrics.period}"`);
  lines.push(`"Generado el:","${new Date().toISOString()}"`);
  lines.push(`"Total Recaudado (COP)":,"${metrics.totalRevenue}"`);
  lines.push(`"Total Estancias Atendidas":,"${metrics.totalSessions}"`);
  lines.push(`"Ticket Promedio (COP)":,"${metrics.averageTicket}"`);
  lines.push(`"Recaudo Efectivo":,"${metrics.cashTotal}"`);
  lines.push(`"Recaudo Nequi/Daviplata":,"${metrics.transferTotal}"`);
  lines.push(`"Recaudo Tarjeta/Datafono":,"${metrics.cardTotal}"`);
  lines.push("");

  // Tabla detallada de movimientos
  lines.push('"Placa","Tipo","Zona","Cédula","Celular","Entrada","Salida","Tarifa Fijada","Total Pagado","Estado"');

  for (const s of sessions) {
    const row = [
      `"${s.plateNormalized}"`,
      `"${s.vehicleCategory}"`,
      `"${s.zone || "N/A"}"`,
      `"${s.driverDocument || "N/A"}"`,
      `"${s.driverPhone || "N/A"}"`,
      `"${s.enteredAt}"`,
      `"${s.exitedAt || "En parqueadero"}"`,
      `"${s.agreedRate ?? 0}"`,
      `"${s.totalCents ?? 0}"`,
      `"${s.status}"`,
    ];
    lines.push(row.join(","));
  }

  return lines.join("\n");
}
