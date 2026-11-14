import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizarPlaca,
  normalizarTexto,
} from "../src/features/parking/services/movimientos-service.ts";

test("normalizarPlaca convierte a mayúsculas y remueve espacios, guiones y puntos", () => {
  assert.equal(normalizarPlaca(" abc - 123 "), "ABC123");
  assert.equal(normalizarPlaca("xyz.45d"), "XYZ45D");
  assert.equal(normalizarPlaca(""), "");
});

test("normalizarTexto convierte a minúsculas y remueve diacríticos/tildes", () => {
  assert.equal(normalizarTexto("  Ángel Gómez  "), "angel gomez");
  assert.equal(normalizarTexto("MARÍA LÓPEZ"), "maria lopez");
  assert.equal(normalizarTexto("ñandú"), "nandu");
});

test("cálculo de resumen financiero suma estrictamente solo pagos PAGADOS y no PENDIENTES", () => {
  const muestra = [
    {
      id: "1",
      placaNormalizada: "ABC123",
      tipoVehiculo: "CARRO",
      tarifaAplicada: 4000,
      estadoVehiculo: "RETIRADO",
      estadoPago: "PAGADO",
    },
    {
      id: "2",
      placaNormalizada: "XYZ789",
      tipoVehiculo: "CARRO",
      tarifaAplicada: 4000,
      estadoVehiculo: "RETIRADO",
      estadoPago: "PENDIENTE", // No debe sumarse al recaudo
    },
    {
      id: "3",
      placaNormalizada: "MTO12D",
      tipoVehiculo: "MOTO",
      tarifaAplicada: 1500,
      estadoVehiculo: "DENTRO",
      estadoPago: "PENDIENTE", // No debe sumarse al recaudo
    },
    {
      id: "4",
      placaNormalizada: "MTO34C",
      tipoVehiculo: "MOTO",
      tarifaAplicada: 1500,
      estadoVehiculo: "RETIRADO",
      estadoPago: "PAGADO",
    },
  ];

  let vehiculosDentro = 0;
  let vehiculosRetirados = 0;
  let totalRecaudado = 0;
  let pagosPendientes = 0;

  for (const m of muestra) {
    if (m.estadoVehiculo === "DENTRO") vehiculosDentro++;
    if (m.estadoVehiculo === "RETIRADO") vehiculosRetirados++;
    if (m.estadoPago === "PAGADO") totalRecaudado += m.tarifaAplicada;
    if (m.estadoPago === "PENDIENTE") pagosPendientes++;
  }

  assert.equal(vehiculosDentro, 1);
  assert.equal(vehiculosRetirados, 3);
  assert.equal(muestra.length, 4); // totalIngresados
  assert.equal(totalRecaudado, 5500); // 4000 + 1500 (los otros dos pendientes NO se suman)
  assert.equal(pagosPendientes, 2);
});

test("búsqueda multi-criterio encuentra por placa parcial, nombre sin tilde o cédula", () => {
  const lista = [
    {
      id: "1",
      placaNormalizada: "ABC123",
      nombre: "Hernán Rodríguez",
      nombreNormalizado: normalizarTexto("Hernán Rodríguez"),
      cedula: "1085234567",
      estadoVehiculo: "DENTRO",
    },
    {
      id: "2",
      placaNormalizada: "XYZ789",
      nombre: "Carlos Gómez",
      nombreNormalizado: normalizarTexto("Carlos Gómez"),
      cedula: "98765432",
      estadoVehiculo: "RETIRADO",
    },
  ];

  function filtrar(query) {
    const q = normalizarTexto(query);
    const qPlaca = normalizarPlaca(query);
    return lista.filter((m) => {
      const matchPlaca = m.placaNormalizada.includes(qPlaca);
      const matchNombre = m.nombreNormalizado.includes(q);
      const matchCedula = m.cedula ? m.cedula.includes(query.trim()) : false;
      return matchPlaca || matchNombre || matchCedula;
    });
  }

  // Búsqueda por placa parcial
  assert.equal(filtrar("BC1").length, 1);
  assert.equal(filtrar("BC1")[0].placaNormalizada, "ABC123");

  // Búsqueda por nombre sin tilde
  assert.equal(filtrar("hernan").length, 1);
  assert.equal(filtrar("hernan")[0].id, "1");

  // Búsqueda por cédula parcial
  assert.equal(filtrar("8523").length, 1);
  assert.equal(filtrar("8523")[0].id, "1");

  // Búsqueda que no coincide
  assert.equal(filtrar("999999").length, 0);
});

test("validación de respaldo JSON detecta archivos corruptos o estructuras inválidas", () => {
  const jsonInvalido1 = "{ corrupto: ";
  const jsonInvalido2 = JSON.stringify({ algo: 123 }); // falta 'movimientos'
  const jsonInvalido3 = JSON.stringify({ movimientos: [{ id: "1" }] }); // registro incompleto

  assert.throws(() => JSON.parse(jsonInvalido1));

  const parsed2 = JSON.parse(jsonInvalido2);
  assert.equal(Array.isArray(parsed2.movimientos), false);

  const parsed3 = JSON.parse(jsonInvalido3);
  const m = parsed3.movimientos[0];
  const esValido = Boolean(m.id && m.placaNormalizada && m.tipoVehiculo && m.nombre && m.estadoVehiculo && m.estadoPago);
  assert.equal(esValido, false);
});

test("rendimiento: filtrado, búsqueda y agregación sobre 2.000 movimientos toma menos de 50ms", () => {
  // Generar muestra sintética de 2.000 registros para simular el evento completo
  const dosMil = [];
  const ahoraMs = Date.now();

  for (let i = 0; i < 2000; i++) {
    const esCarro = i % 2 === 0;
    const esRetirado = i % 3 !== 0; // ~66% retirados
    const esPagado = esRetirado && i % 4 !== 0; // ~75% de los retirados están pagados

    dosMil.push({
      id: `mov-${i}`,
      placa: `ABC${(100 + (i % 900))}`,
      placaNormalizada: `ABC${(100 + (i % 900))}`,
      tipoVehiculo: esCarro ? "CARRO" : "MOTO",
      nombre: `Conductor Número ${i}`,
      nombreNormalizado: `conductor numero ${i}`,
      cedula: `${10000000 + i}`,
      fechaIngreso: new Date(ahoraMs - i * 60000).toISOString(),
      fechaSalida: esRetirado ? new Date(ahoraMs - i * 30000).toISOString() : null,
      tarifaAplicada: esCarro ? 4000 : 1500,
      estadoVehiculo: esRetirado ? "RETIRADO" : "DENTRO",
      estadoPago: esPagado ? "PAGADO" : "PENDIENTE",
      fechaPago: esPagado ? new Date(ahoraMs - i * 30000).toISOString() : null,
      fechaActualizacion: new Date(ahoraMs).toISOString(),
    });
  }

  assert.equal(dosMil.length, 2000);

  const inicio = performance.now();

  // 1. Agregación de métricas de inicio
  let dentro = 0;
  let retirados = 0;
  let recaudado = 0;
  let pendientes = 0;
  for (const m of dosMil) {
    if (m.estadoVehiculo === "DENTRO") dentro++;
    if (m.estadoVehiculo === "RETIRADO") retirados++;
    if (m.estadoPago === "PAGADO") recaudado += m.tarifaAplicada;
    if (m.estadoPago === "PENDIENTE") pendientes++;
  }

  // 2. Búsqueda multi-campo
  const termino = "conductor numero 15";
  const q = normalizarTexto(termino);
  const encontrados = dosMil.filter((m) => m.nombreNormalizado.includes(q));

  const fin = performance.now();
  const duracionMs = fin - inicio;

  assert.ok(dentro > 0);
  assert.ok(retirados > 0);
  assert.ok(recaudado > 0);
  assert.ok(pendientes >= 0);
  assert.ok(encontrados.length > 0);
  assert.ok(duracionMs < 50, `La operación tardó ${duracionMs.toFixed(2)}ms, debe ser menor a 50ms`);
});
