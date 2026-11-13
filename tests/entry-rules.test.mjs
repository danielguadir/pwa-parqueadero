import test from "node:test";
import assert from "node:assert/strict";
import {
  canRegisterEntry,
  buildEntryEntities,
} from "../src/features/parking/domain/entry-rules.ts";

test("canRegisterEntry aprueba entrada válida con cupo y sin sesión abierta", () => {
  const result = canRegisterEntry(
    { plate: "ABC123", vehicleCategory: "CAR" },
    false,
    {
      carOccupied: 10,
      carCapacity: 40,
      motorcycleOccupied: 5,
      motorcycleCapacity: 30,
      otherOccupied: 0,
      totalOccupied: 15,
      totalCapacity: 70,
    }
  );

  assert.equal(result.canRegister, true);
  assert.equal(result.normalizedPlate, "ABC123");
});

test("canRegisterEntry rechaza si el vehículo ya tiene una estancia activa dentro", () => {
  const result = canRegisterEntry(
    { plate: "ABC-123", vehicleCategory: "CAR" },
    true
  );

  assert.equal(result.canRegister, false);
  assert.ok(result.reason?.includes("ya tiene una estancia abierta"));
});

test("canRegisterEntry rechaza si se superó la capacidad de la categoría", () => {
  // Capacidad de carros llena
  const carFullResult = canRegisterEntry(
    { plate: "ABC123", vehicleCategory: "CAR" },
    false,
    {
      carOccupied: 40,
      carCapacity: 40,
      motorcycleOccupied: 5,
      motorcycleCapacity: 30,
      otherOccupied: 0,
      totalOccupied: 45,
      totalCapacity: 70,
    }
  );

  assert.equal(carFullResult.canRegister, false);
  assert.ok(carFullResult.reason?.includes("Capacidad máxima alcanzada para automóviles"));

  // Capacidad de motos llena
  const motoFullResult = canRegisterEntry(
    { plate: "XYZ12D", vehicleCategory: "MOTORCYCLE" },
    false,
    {
      carOccupied: 10,
      carCapacity: 40,
      motorcycleOccupied: 30,
      motorcycleCapacity: 30,
      otherOccupied: 0,
      totalOccupied: 40,
      totalCapacity: 70,
    }
  );

  assert.equal(motoFullResult.canRegister, false);
  assert.ok(motoFullResult.reason?.includes("Capacidad máxima alcanzada para motocicletas"));
});

test("buildEntryEntities genera sesión y operación de sincronización consistentes", () => {
  const fixedDate = new Date("2026-11-13T10:00:00.000Z");
  const deviceId = "test-device-uuid-123";

  const { session, operation } = buildEntryEntities(
    {
      plate: "hjk-789",
      vehicleCategory: "CAR",
      notes: "Cuidado con el retrovisor",
      parkingLotId: "lot-central",
    },
    deviceId,
    fixedDate
  );

  // Verificaciones de la sesión
  assert.ok(session.id);
  assert.equal(session.plateNormalized, "HJK789");
  assert.equal(session.vehicleCategory, "CAR");
  assert.equal(session.status, "OPEN");
  assert.equal(session.enteredAt, "2026-11-13T10:00:00.000Z");
  assert.equal(session.exitedAt, null);
  assert.equal(session.notes, "Cuidado con el retrovisor");
  assert.equal(session.syncState, "PENDING");
  assert.equal(session.parkingLotId, "lot-central");
  assert.equal(session.agreedRate, 4000); // Tarifa fija por defecto para CAR

  // Verificaciones de la operación en cola
  assert.ok(operation.id);
  assert.equal(operation.deviceId, deviceId);
  assert.equal(operation.operationType, "OPEN_SESSION");
  assert.equal(operation.state, "PENDING");
  assert.equal(operation.createdAt, "2026-11-13T10:00:00.000Z");
  assert.equal(operation.payload.sessionId, session.id);
  assert.equal(operation.payload.plateNormalized, "HJK789");
  assert.equal(operation.payload.agreedRate, 4000);
});

test("buildEntryEntities guarda cédula, celular, zona y tarifa pactada personalizada", () => {
  const fixedDate = new Date("2026-11-13T10:00:00.000Z");
  const deviceId = "device-xyz";

  const { session, operation } = buildEntryEntities(
    {
      plate: "MTO12C",
      vehicleCategory: "MOTORCYCLE",
      zone: "ZONA_SUR",
      driverDocument: "1085234567",
      driverPhone: "3124567890",
      agreedRate: 1500,
    },
    deviceId,
    fixedDate
  );

  assert.equal(session.plateNormalized, "MTO12C");
  assert.equal(session.vehicleCategory, "MOTORCYCLE");
  assert.equal(session.zone, "ZONA_SUR");
  assert.equal(session.driverDocument, "1085234567");
  assert.equal(session.driverPhone, "3124567890");
  assert.equal(session.agreedRate, 1500);

  assert.equal(operation.payload.driverDocument, "1085234567");
  assert.equal(operation.payload.driverPhone, "3124567890");
  assert.equal(operation.payload.zone, "ZONA_SUR");
  assert.equal(operation.payload.agreedRate, 1500);
});
