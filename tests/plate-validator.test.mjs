import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePlate,
  inferVehicleCategory,
  validatePlate,
} from "../src/features/parking/domain/plate-validator.ts";

test("normalizePlate limpia espacios, guiones y convierte a mayúsculas", () => {
  assert.equal(normalizePlate(" abc-123 "), "ABC123");
  assert.equal(normalizePlate("xyz_98d"), "XYZ98D");
  assert.equal(normalizePlate("m-k-l.456"), "MKL456");
  assert.equal(normalizePlate(""), "");
});

test("inferVehicleCategory detecta correctamente tipos de vehículo comunes", () => {
  // Automóviles estándar (3 letras, 3 números)
  assert.equal(inferVehicleCategory("ABC123"), "CAR");
  assert.equal(inferVehicleCategory("XYZ999"), "CAR");

  // Motocicletas modernas (3 letras, 2 números, 1 letra)
  assert.equal(inferVehicleCategory("ABC12D"), "MOTORCYCLE");
  assert.equal(inferVehicleCategory("HJK99A"), "MOTORCYCLE");

  // Motocicletas clásicas (3 letras, 2 números)
  assert.equal(inferVehicleCategory("ABC12"), "MOTORCYCLE");

  // Otros formatos
  assert.equal(inferVehicleCategory("REMO1234"), "OTHER");
});

test("validatePlate rechaza placas inválidas o fuera de límites", () => {
  // Placa vacía
  const emptyRes = validatePlate("   ");
  assert.equal(emptyRes.isValid, false);
  assert.ok(emptyRes.error?.includes("vacía"));

  // Placa demasiado corta (< 4 caracteres)
  const shortRes = validatePlate("A12");
  assert.equal(shortRes.isValid, false);
  assert.ok(shortRes.error?.includes("corta"));

  // Placa demasiado larga (> 8 caracteres)
  const longRes = validatePlate("ABCDEFGHI123");
  assert.equal(longRes.isValid, false);
  assert.ok(longRes.error?.includes("larga"));

  // Caracteres inválidos
  const invalidCharRes = validatePlate("ABC*123");
  assert.equal(invalidCharRes.isValid, false);
  assert.ok(invalidCharRes.error?.includes("letras y números"));
});

test("validatePlate valida y normaliza placas válidas", () => {
  const carRes = validatePlate("abc-123");
  assert.equal(carRes.isValid, true);
  assert.equal(carRes.normalizedPlate, "ABC123");
  assert.equal(carRes.suggestedType, "CAR");

  const motoRes = validatePlate("xyz 45k");
  assert.equal(motoRes.isValid, true);
  assert.equal(motoRes.normalizedPlate, "XYZ45K");
  assert.equal(motoRes.suggestedType, "MOTORCYCLE");
});
