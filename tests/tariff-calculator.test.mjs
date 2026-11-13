import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateParkingFee,
  DEFAULT_TARIFF_CONFIG,
} from "../src/features/billing/domain/tariff-calculator.ts";

test("calculateParkingFee aplica periodo de gracia para estancias cortas", () => {
  const entered = "2026-11-13T10:00:00.000Z";
  const exited = "2026-11-13T10:08:00.000Z"; // 8 minutos

  const result = calculateParkingFee(entered, exited, "CAR", DEFAULT_TARIFF_CONFIG);

  assert.equal(result.totalMinutes, 8);
  assert.equal(result.amountDue, 0);
  assert.equal(result.isGracePeriod, true);
  assert.ok(result.breakdown.includes("cortesía"));
});

test("calculateParkingFee cobra tarifa base de 1 hora hasta 60 minutos", () => {
  const entered = "2026-11-13T10:00:00.000Z";
  const exited = "2026-11-13T10:45:00.000Z"; // 45 minutos

  // Automóvil: $3.500
  const carResult = calculateParkingFee(entered, exited, "CAR", DEFAULT_TARIFF_CONFIG);
  assert.equal(carResult.amountDue, 3500);
  assert.equal(carResult.isGracePeriod, false);

  // Motocicleta: $1.800
  const motoResult = calculateParkingFee(entered, exited, "MOTORCYCLE", DEFAULT_TARIFF_CONFIG);
  assert.equal(motoResult.amountDue, 1800);
  assert.equal(motoResult.isGracePeriod, false);
});

test("calculateParkingFee cobra fracciones de 15 minutos tras la primera hora", () => {
  const entered = "2026-11-13T10:00:00.000Z";
  const exited = "2026-11-13T11:14:00.000Z"; // 74 minutos = 1 hora + 14 min (1 bloque de 15 min)

  const carResult = calculateParkingFee(entered, exited, "CAR", DEFAULT_TARIFF_CONFIG);

  // Hora base = 3500. Bloques por hora = 4. Valor bloque = Math.round(3500 / 4) = 875.
  // 1 hora + 1 bloque = 3500 + 875 = 4375.
  assert.equal(carResult.totalMinutes, 74);
  assert.equal(carResult.amountDue, 4375);
  assert.ok(carResult.breakdown.includes("1 fracción(es)"));
});

test("calculateParkingFee calcula correctamente estancias prolongadas", () => {
  const entered = "2026-11-13T10:00:00.000Z";
  const exited = "2026-11-13T12:30:00.000Z"; // 150 minutos = 2 horas y media

  const motoResult = calculateParkingFee(entered, exited, "MOTORCYCLE", DEFAULT_TARIFF_CONFIG);

  // Moto: Hora base = 1800. Bloque 15m = 450.
  // 1 hora (60m) + 90m extra (6 bloques de 15m).
  // Total = 1800 + (6 * 450) = 1800 + 2700 = 4500.
  assert.equal(motoResult.totalMinutes, 150);
  assert.equal(motoResult.amountDue, 4500);
});
