import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateParkingFee,
  DEFAULT_TARIFF_CONFIG,
} from "../src/features/billing/domain/tariff-calculator.ts";

test("calculateParkingFee aplica tarifa plana por defecto ($4.000 carro / $1.500 moto) independientemente del tiempo", () => {
  const entered = "2026-11-13T10:00:00.000Z";
  // 5 minutos después
  const shortExit = "2026-11-13T10:05:00.000Z";
  // 3 horas después
  const longExit = "2026-11-13T13:00:00.000Z";

  // Carro corta estancia: $4.000
  const carShort = calculateParkingFee(entered, shortExit, "CAR", DEFAULT_TARIFF_CONFIG);
  assert.equal(carShort.amountDue, 4000);
  assert.equal(carShort.isGracePeriod, false);
  assert.ok(carShort.breakdown.includes("4.000"));

  // Carro larga estancia: $4.000 (indiferente del tiempo)
  const carLong = calculateParkingFee(entered, longExit, "CAR", DEFAULT_TARIFF_CONFIG);
  assert.equal(carLong.amountDue, 4000);

  // Moto: $1.500 fija
  const moto = calculateParkingFee(entered, longExit, "MOTORCYCLE", DEFAULT_TARIFF_CONFIG);
  assert.equal(moto.amountDue, 1500);
  assert.ok(moto.breakdown.includes("1.500"));
});

test("calculateParkingFee respeta tarifa personalizada acordada al ingreso si existe", () => {
  const entered = "2026-11-13T10:00:00.000Z";
  const exited = "2026-11-13T12:00:00.000Z";

  const customResult = calculateParkingFee(
    entered,
    exited,
    "CAR",
    DEFAULT_TARIFF_CONFIG,
    5000 // Tarifa personalizada acordada de $5.000
  );

  assert.equal(customResult.amountDue, 5000);
  assert.ok(customResult.breakdown.includes("acordada al ingreso"));
});

test("calculateParkingFee soporta modo TIME_BASED cuando se configura explícitamente", () => {
  const timeConfig = {
    ...DEFAULT_TARIFF_CONFIG,
    billingMode: "TIME_BASED",
    carHourlyRate: 4000,
    motorcycleHourlyRate: 1500,
    gracePeriodMinutes: 10,
    chargeFractionAfterHour: true,
    fractionBlockMinutes: 15,
  };

  const entered = "2026-11-13T10:00:00.000Z";

  // Gracia: 8 minutos -> 0
  const grace = calculateParkingFee(entered, "2026-11-13T10:08:00.000Z", "CAR", timeConfig);
  assert.equal(grace.amountDue, 0);
  assert.equal(grace.isGracePeriod, true);

  // 1 hora: 45 minutos -> 4000
  const oneHour = calculateParkingFee(entered, "2026-11-13T10:45:00.000Z", "CAR", timeConfig);
  assert.equal(oneHour.amountDue, 4000);

  // Fracción: 75 minutos (1 hora + 1 fracción de 15 min de 1000) -> 5000
  const fraction = calculateParkingFee(entered, "2026-11-13T11:15:00.000Z", "CAR", timeConfig);
  assert.equal(fraction.amountDue, 5000);
});
