import { getLocalDb } from "../../../lib/db/local-db.ts";
import { generarUUID } from "../../../lib/utils/uuid.ts";
import type {
  MovimientoParqueadero,
  ConfiguracionParqueadero,
  ResumenInicio,
  FiltroHistorial,
  RegistroIngresoInput,
  EstadoPago,
} from "../../../types/movimiento.ts";

export const CONFIG_INICIAL: ConfiguracionParqueadero = {
  tarifaCarro: 4000,
  tarifaMoto: 1500,
  nombreEvento: "Parqueadero Evento Fin de Semana",
  ultimaCopiaSeguridad: null,
};

/**
 * Normaliza una placa para comparaciones estrictas:
 * Mayúsculas, sin espacios, guiones o puntos.
 */
export function normalizarPlaca(str: string): string {
  if (!str) return "";
  return str.trim().toUpperCase().replace(/[\s\-_.]/g, "");
}

/**
 * Normaliza un texto para búsquedas insensibles a mayúsculas y acentos.
 */
export function normalizarTexto(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Obtiene la configuración de tarifas y del evento desde Dexie.
 */
export async function obtenerConfiguracionEvento(): Promise<ConfiguracionParqueadero> {
  const db = getLocalDb();
  try {
    const configRow = await db.configuracion.get("tarifas_evento");
    if (!configRow || !configRow.valor) {
      return CONFIG_INICIAL;
    }
    return { ...CONFIG_INICIAL, ...(configRow.valor as Partial<ConfiguracionParqueadero>) };
  } catch (err) {
    console.warn("No se pudo leer configuración local, usando inicial:", err);
    return CONFIG_INICIAL;
  }
}

/**
 * Guarda las tarifas y configuración del evento en Dexie.
 */
export async function guardarConfiguracionEvento(conf: ConfiguracionParqueadero): Promise<void> {
  const db = getLocalDb();
  await db.configuracion.put({
    clave: "tarifas_evento",
    valor: conf,
  });
}

/**
 * Verifica si un vehículo con la misma placa ya está actualmente DENTRO.
 */
export async function verificarPlacaDentro(placa: string): Promise<MovimientoParqueadero | undefined> {
  const db = getLocalDb();
  const normalizada = normalizarPlaca(placa);
  if (!normalizada) return undefined;

  return db.movimientos
    .where("[estadoVehiculo+placaNormalizada]")
    .equals(["DENTRO", normalizada])
    .first();
}

/**
 * Registra el ingreso atómico de un vehículo.
 * - Valida campos obligatorios.
 * - Congela la tarifa según tipo de vehículo.
 * - Verifica duplicados.
 * - Garantiza escritura confirmada en IndexedDB.
 */
export async function registrarIngreso(input: RegistroIngresoInput): Promise<{
  success: boolean;
  movimiento?: MovimientoParqueadero;
  error?: string;
}> {
  const placa = input.placa.trim();
  const nombre = input.nombre.trim();

  if (!placa) {
    return { success: false, error: "La placa del vehículo es obligatoria." };
  }
  if (!nombre) {
    return { success: false, error: "El nombre del responsable es obligatorio." };
  }

  const placaNormalizada = normalizarPlaca(placa);
  if (placaNormalizada.length < 3 || placaNormalizada.length > 10) {
    return { success: false, error: "La placa debe tener entre 3 y 10 caracteres alfanuméricos." };
  }

  const db = getLocalDb();

  // Comprobar si ya está dentro
  const existente = await verificarPlacaDentro(placa);
  if (existente) {
    return {
      success: false,
      error: `El vehículo con placa ${placaNormalizada} ya tiene un ingreso activo registrado a las ${new Date(existente.fechaIngreso).toLocaleTimeString("es-CO")}.`,
    };
  }

  // Obtener tarifas configuradas
  const config = await obtenerConfiguracionEvento();
  const tarifaAplicada = input.tipoVehiculo === "CARRO" ? config.tarifaCarro : config.tarifaMoto;

  const ahoraIso = new Date().toISOString();
  const movimiento: MovimientoParqueadero = {
    id: generarUUID(),
    placa,
    placaNormalizada,
    tipoVehiculo: input.tipoVehiculo,
    nombre,
    nombreNormalizado: normalizarTexto(nombre),
    celular: input.celular?.trim() || undefined,
    cedula: input.cedula?.trim() || undefined,
    fechaIngreso: ahoraIso,
    fechaSalida: null,
    tarifaAplicada,
    estadoVehiculo: "DENTRO",
    estadoPago: "PENDIENTE",
    fechaPago: null,
    fechaActualizacion: ahoraIso,
  };

  // Guardado atómico con verificación de confirmación
  await db.transaction("rw", db.movimientos, async () => {
    await db.movimientos.add(movimiento);
  });

  return { success: true, movimiento };
}

/**
 * Búsqueda instantánea multi-criterio para la pantalla de Retiro.
 * Busca por:
 * 1. Placa completa o parcial.
 * 2. Nombre o apellido (insensible a mayúsculas y acentos).
 * 3. Cédula completa o parcial.
 * Prioriza los que están actualmente DENTRO.
 */
export async function buscarParaRetiro(termino: string): Promise<MovimientoParqueadero[]> {
  const db = getLocalDb();
  const q = normalizarTexto(termino);
  const qPlaca = normalizarPlaca(termino);

  const todos = await db.movimientos.toArray();

  let resultados = todos;

  if (q.length > 0) {
    resultados = todos.filter((m) => {
      const matchPlaca = m.placaNormalizada.includes(qPlaca);
      const matchNombre = m.nombreNormalizado.includes(q);
      const matchCedula = m.cedula ? m.cedula.includes(termino.trim()) : false;
      return matchPlaca || matchNombre || matchCedula;
    });
  }

  // Ordenar: Primero los que están DENTRO, luego más recientes primero
  resultados.sort((a, b) => {
    if (a.estadoVehiculo === "DENTRO" && b.estadoVehiculo !== "DENTRO") return -1;
    if (a.estadoVehiculo !== "DENTRO" && b.estadoVehiculo === "DENTRO") return 1;
    return new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime();
  });

  return resultados.slice(0, 30);
}

/**
 * Registra el retiro de un vehículo con transacción atómica:
 * - RETIRAR — PAGADO
 * - RETIRAR — PAGO PENDIENTE
 */
export async function registrarRetiro(
  id: string,
  estadoPago: EstadoPago
): Promise<{ success: boolean; movimiento?: MovimientoParqueadero; error?: string }> {
  const db = getLocalDb();

  let movimientoActualizado: MovimientoParqueadero | undefined;

  await db.transaction("rw", db.movimientos, async () => {
    const actual = await db.movimientos.get(id);
    if (!actual) {
      throw new Error("El registro de movimiento no fue encontrado.");
    }
    if (actual.estadoVehiculo === "RETIRADO") {
      throw new Error(`El vehículo ${actual.placaNormalizada} ya fue retirado previamente a las ${new Date(actual.fechaSalida || "").toLocaleTimeString("es-CO")}.`);
    }

    const ahoraIso = new Date().toISOString();
    movimientoActualizado = {
      ...actual,
      estadoVehiculo: "RETIRADO",
      fechaSalida: ahoraIso,
      estadoPago,
      fechaPago: estadoPago === "PAGADO" ? ahoraIso : actual.fechaPago,
      fechaActualizacion: ahoraIso,
    };

    await db.movimientos.put(movimientoActualizado);
  });

  return { success: true, movimiento: movimientoActualizado };
}

/**
 * Permite marcar como PAGADO un vehículo que previamente salió con pago pendiente.
 * No modifica la fecha u hora histórica de salida.
 */
export async function marcarPagoPendiente(
  id: string
): Promise<{ success: boolean; movimiento?: MovimientoParqueadero; error?: string }> {
  const db = getLocalDb();
  let movimientoActualizado: MovimientoParqueadero | undefined;

  await db.transaction("rw", db.movimientos, async () => {
    const actual = await db.movimientos.get(id);
    if (!actual) {
      throw new Error("Registro no encontrado.");
    }

    const ahoraIso = new Date().toISOString();
    movimientoActualizado = {
      ...actual,
      estadoPago: "PAGADO",
      fechaPago: ahoraIso,
      fechaActualizacion: ahoraIso,
    };

    await db.movimientos.put(movimientoActualizado);
  });

  return { success: true, movimiento: movimientoActualizado };
}

/**
 * Calcula en tiempo real las 5 métricas del panel de inicio.
 * - Total recaudado SOLO suma registros con estadoPago === "PAGADO".
 */
export async function obtenerResumenInicio(): Promise<ResumenInicio> {
  const db = getLocalDb();
  const todos = await db.movimientos.toArray();

  let vehiculosDentro = 0;
  let vehiculosRetirados = 0;
  let totalRecaudado = 0;
  let pagosPendientes = 0;

  for (const m of todos) {
    if (m.estadoVehiculo === "DENTRO") {
      vehiculosDentro++;
    } else if (m.estadoVehiculo === "RETIRADO") {
      vehiculosRetirados++;
    }

    if (m.estadoPago === "PAGADO") {
      totalRecaudado += m.tarifaAplicada;
    } else if (m.estadoPago === "PENDIENTE") {
      pagosPendientes++;
    }
  }

  return {
    vehiculosDentro,
    totalIngresados: todos.length,
    vehiculosRetirados,
    totalRecaudado,
    pagosPendientes,
  };
}

/**
 * Obtiene el listado de movimientos para el historial con filtros.
 */
export async function obtenerHistorial(filtro: FiltroHistorial = "TODOS"): Promise<MovimientoParqueadero[]> {
  const db = getLocalDb();
  const todos = await db.movimientos.toArray();

  let filtrados = todos;

  switch (filtro) {
    case "DENTRO":
      filtrados = todos.filter((m) => m.estadoVehiculo === "DENTRO");
      break;
    case "RETIRADOS":
      filtrados = todos.filter((m) => m.estadoVehiculo === "RETIRADO");
      break;
    case "PAGADOS":
      filtrados = todos.filter((m) => m.estadoPago === "PAGADO");
      break;
    case "PENDIENTES":
      filtrados = todos.filter((m) => m.estadoPago === "PENDIENTE");
      break;
    default:
      filtrados = todos;
      break;
  }

  // Ordenar descendente por fecha de ingreso
  filtrados.sort((a, b) => new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime());

  return filtrados;
}

/**
 * Genera el archivo CSV con todos los movimientos del evento.
 */
export async function generarCsvMovimientos(): Promise<string> {
  const db = getLocalDb();
  const todos = await db.movimientos.toArray();
  todos.sort((a, b) => new Date(a.fechaIngreso).getTime() - new Date(b.fechaIngreso).getTime());

  const lineas: string[] = [];
  lineas.push('"ID","Placa","Tipo","Nombre","Celular","Cédula","Fecha Ingreso","Fecha Salida","Tarifa ($ COP)","Estado Vehículo","Estado Pago","Fecha Pago"');

  for (const m of todos) {
    const fila = [
      `"${m.id}"`,
      `"${m.placaNormalizada}"`,
      `"${m.tipoVehiculo}"`,
      `"${m.nombre.replace(/"/g, '""')}"`,
      `"${m.celular || ""}"`,
      `"${m.cedula || ""}"`,
      `"${m.fechaIngreso}"`,
      `"${m.fechaSalida || ""}"`,
      `"${m.tarifaAplicada}"`,
      `"${m.estadoVehiculo}"`,
      `"${m.estadoPago}"`,
      `"${m.fechaPago || ""}"`,
    ];
    lineas.push(fila.join(","));
  }

  return lineas.join("\n");
}

/**
 * Genera el respaldo completo JSON (configuración + todos los movimientos).
 */
export async function generarRespaldoJson(): Promise<string> {
  const db = getLocalDb();
  const config = await obtenerConfiguracionEvento();
  const movimientos = await db.movimientos.toArray();

  const ahoraIso = new Date().toISOString();
  config.ultimaCopiaSeguridad = ahoraIso;
  await guardarConfiguracionEvento(config);

  const respaldo = {
    sistema: "ParkingControl-PWA",
    version: 1,
    fechaExportacion: ahoraIso,
    configuracion: config,
    totalMovimientos: movimientos.length,
    movimientos,
  };

  return JSON.stringify(respaldo, null, 2);
}

/**
 * Valida y restaura un archivo JSON de respaldo.
 * Protege contra archivos corruptos o estructuras incompatibles.
 */
export async function restaurarRespaldoJson(
  contenidoJson: string
): Promise<{ success: boolean; totalRestaurados: number; error?: string }> {
  try {
    const parsed = JSON.parse(contenidoJson);

    if (!parsed || !Array.isArray(parsed.movimientos)) {
      return {
        success: false,
        totalRestaurados: 0,
        error: "El archivo no contiene un formato de respaldo válido de ParkingControl.",
      };
    }

    const movimientos: MovimientoParqueadero[] = parsed.movimientos;

    // Validación básica de estructura de cada movimiento
    for (const m of movimientos) {
      if (!m.id || !m.placaNormalizada || !m.tipoVehiculo || !m.nombre || !m.estadoVehiculo || !m.estadoPago) {
        return {
          success: false,
          totalRestaurados: 0,
          error: "El archivo contiene registros incompletos o dañados.",
        };
      }
    }

    const db = getLocalDb();

    await db.transaction("rw", [db.movimientos, db.configuracion], async () => {
      // Limpiar y restaurar
      await db.movimientos.clear();
      await db.movimientos.bulkAdd(movimientos);

      if (parsed.configuracion) {
        await db.configuracion.put({
          clave: "tarifas_evento",
          valor: parsed.configuracion,
        });
      }
    });

    return {
      success: true,
      totalRestaurados: movimientos.length,
    };
  } catch (err) {
    return {
      success: false,
      totalRestaurados: 0,
      error: `Error al procesar el archivo: ${err instanceof Error ? err.message : "JSON inválido"}`,
    };
  }
}
