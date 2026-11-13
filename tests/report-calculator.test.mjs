import test from "node:test";
import assert from "node:assert/strict";
import {
  filterSessionsByPeriod,
  calculateConsolidatedMetrics,
  generateCsvReport,
} from "../src/features/reports/domain/report-calculator.ts";

test("calculateConsolidatedMetrics calcula métricas correctas de ingresos y medios de pago", () => {
  const sessions = [
    {
      id: "sess-1",
      plateNormalized: "AAA111",
      vehicleCategory: "CAR",
      status: "CLOSED",
      totalCents: 4000,
      enteredAt: "2026-11-13T08:00:00.000Z",
      exitedAt: "2026-11-13T09:00:00.000Z",
      syncState: "CONFIRMED",
    },
    {
      id: "sess-2",
      plateNormalized: "BBB222",
      vehicleCategory: "MOTORCYCLE",
      status: "CLOSED",
      totalCents: 1500,
      enteredAt: "2026-11-13T08:30:00.000Z",
      exitedAt: "2026-11-13T09:15:00.000Z",
      syncState: "CONFIRMED",
    },
    {
      id: "sess-3",
      plateNormalized: "CCC333",
      vehicleCategory: "CAR",
      status: "CLOSED",
      totalCents: 4000,
      enteredAt: "2026-11-13T09:00:00.000Z",
      exitedAt: "2026-11-13T10:00:00.000Z",
      syncState: "CONFIRMED",
    },
  ];

  const payments = [
    {
      id: "pay-1",
      sessionId: "sess-1",
      plateNormalized: "AAA111",
      amountCents: 4000,
      method: "CASH",
      status: "CONFIRMED",
      createdAt: "2026-11-13T09:00:00.000Z",
      syncState: "CONFIRMED",
    },
    {
      id: "pay-2",
      sessionId: "sess-2",
      plateNormalized: "BBB222",
      amountCents: 1500,
      method: "NEQUI_DAVIPLATA",
      status: "CONFIRMED",
      createdAt: "2026-11-13T09:15:00.000Z",
      syncState: "CONFIRMED",
    },
    {
      id: "pay-3",
      sessionId: "sess-3",
      plateNormalized: "CCC333",
      amountCents: 4000,
      method: "CARD",
      status: "CONFIRMED",
      createdAt: "2026-11-13T10:00:00.000Z",
      syncState: "CONFIRMED",
    },
  ];

  const metrics = calculateConsolidatedMetrics(sessions, payments, "TODAY");

  assert.equal(metrics.totalRevenue, 9500);
  assert.equal(metrics.totalSessions, 3);
  assert.equal(metrics.cashTotal, 4000);
  assert.equal(metrics.transferTotal, 1500);
  assert.equal(metrics.cardTotal, 4000);
  assert.equal(metrics.carCount, 2);
  assert.equal(metrics.motoCount, 1);
  assert.equal(metrics.averageTicket, Math.round(9500 / 3));
});

test("filterSessionsByPeriod filtra por día actual", () => {
  const fixedNow = new Date("2026-11-13T15:00:00.000Z");

  const sessions = [
    {
      id: "today-1",
      enteredAt: "2026-11-13T10:00:00.000Z",
      exitedAt: "2026-11-13T11:00:00.000Z",
      status: "CLOSED",
      plateNormalized: "TODAY1",
    },
    {
      id: "yesterday-1",
      enteredAt: "2026-11-12T10:00:00.000Z",
      exitedAt: "2026-11-12T11:00:00.000Z",
      status: "CLOSED",
      plateNormalized: "YEST1",
    },
  ];

  const todayList = filterSessionsByPeriod(sessions, "TODAY", fixedNow);
  assert.equal(todayList.length, 1);
  assert.equal(todayList[0].id, "today-1");

  const allList = filterSessionsByPeriod(sessions, "ALL", fixedNow);
  assert.equal(allList.length, 2);
});

test("generateCsvReport exporta encabezados y filas completas", () => {
  const metrics = {
    period: "TODAY",
    totalRevenue: 5500,
    totalSessions: 2,
    averageTicket: 2750,
    cashTotal: 4000,
    transferTotal: 1500,
    cardTotal: 0,
    otherTotal: 0,
    carCount: 1,
    motoCount: 1,
    otherCount: 0,
  };

  const sessions = [
    {
      id: "s1",
      plateNormalized: "CAR123",
      vehicleCategory: "CAR",
      zone: "ZONA_NORTE",
      driverDocument: "1085234567",
      driverPhone: "3124567890",
      enteredAt: "2026-11-13T10:00:00.000Z",
      exitedAt: "2026-11-13T11:00:00.000Z",
      agreedRate: 4000,
      totalCents: 4000,
      status: "CLOSED",
    },
  ];

  const csv = generateCsvReport(metrics, sessions);

  assert.ok(csv.includes("Reporte Consolidado"));
  assert.ok(csv.includes("CAR123"));
  assert.ok(csv.includes("1085234567"));
  assert.ok(csv.includes("ZONA_NORTE"));
  assert.ok(csv.includes("5500"));
});
