import { NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { MovimientoParqueadero, ConfiguracionParqueadero } from "@/types/movimiento";

const DATA_DIR = join(process.cwd(), "data");
const STORE_FILE = join(DATA_DIR, "sync-store.json");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface SyncPayload {
  movimientos: MovimientoParqueadero[];
  configuracion?: ConfiguracionParqueadero;
  accion?: "SYNC" | "RESET";
}

const CONFIG_DEFAULT: ConfiguracionParqueadero = {
  tarifaCarro: 4000,
  tarifaMoto: 1500,
  nombreEvento: "ParqueaderoGP",
  ultimaCopiaSeguridad: null,
};

function toSupabaseRow(m: MovimientoParqueadero) {
  return {
    id: m.id,
    codigo: m.codigo,
    placa: m.placa,
    placa_normalizada: m.placaNormalizada,
    tipo_vehiculo: m.tipoVehiculo,
    nombre: m.nombre,
    nombre_normalizado: m.nombreNormalizado,
    celular: m.celular || null,
    cedula: m.cedula || null,
    fecha_ingreso: m.fechaIngreso,
    fecha_salida: m.fechaSalida || null,
    tarifa_aplicada: Number(m.tarifaAplicada),
    estado_vehiculo: m.estadoVehiculo,
    estado_pago: m.estadoPago,
    fecha_pago: m.fechaPago || null,
    fecha_actualizacion: m.fechaActualizacion || m.fechaIngreso,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromSupabaseRow(r: any): MovimientoParqueadero {
  return {
    id: r.id,
    codigo: r.codigo || "",
    placa: r.placa,
    placaNormalizada: r.placa_normalizada,
    tipoVehiculo: r.tipo_vehiculo,
    nombre: r.nombre,
    nombreNormalizado: r.nombre_normalizado,
    celular: r.celular || undefined,
    cedula: r.cedula || undefined,
    fechaIngreso: r.fecha_ingreso,
    fechaSalida: r.fecha_salida || null,
    tarifaAplicada: Number(r.tarifa_aplicada),
    estadoVehiculo: r.estado_vehiculo,
    estadoPago: r.estado_pago,
    fechaPago: r.fecha_pago || null,
    fechaActualizacion: r.fecha_actualizacion || r.fecha_ingreso,
  };
}

function readStoreFallback(): {
  movimientos: MovimientoParqueadero[];
  configuracion: ConfiguracionParqueadero;
} {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!existsSync(STORE_FILE)) {
      const initial = { movimientos: [], configuracion: CONFIG_DEFAULT };
      writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = readFileSync(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      movimientos: Array.isArray(parsed.movimientos) ? parsed.movimientos : [],
      configuracion: parsed.configuracion || CONFIG_DEFAULT,
    };
  } catch {
    return { movimientos: [], configuracion: CONFIG_DEFAULT };
  }
}

function writeStoreFallback(data: {
  movimientos: MovimientoParqueadero[];
  configuracion: ConfiguracionParqueadero;
}) {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Modo solo lectura en Serverless
  }
}

export async function GET() {
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/movimientos?select=*&order=fecha_ingreso.desc`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        cache: "no-store",
      });

      if (resp.ok) {
        const rows = await resp.json();
        const movimientos = rows.map(fromSupabaseRow);
        return NextResponse.json({
          success: true,
          provider: "supabase",
          movimientos,
          configuracion: CONFIG_DEFAULT,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn("[SyncAPI] Error al consultar Supabase, usando fallback:", err);
    }
  }

  const store = readStoreFallback();
  return NextResponse.json({
    success: true,
    provider: "local-store",
    movimientos: store.movimientos,
    configuracion: store.configuracion,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SyncPayload;

    // A. SINCRONIZACIÓN CON SUPABASE SI ESTÁ CONFIGURADO
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        if (body.accion === "RESET") {
          // Limpiar todos los registros de prueba en Supabase
          await fetch(`${SUPABASE_URL}/rest/v1/movimientos?id=not.is.null`, {
            method: "DELETE",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          });

          return NextResponse.json({
            success: true,
            provider: "supabase",
            movimientos: [],
            configuracion: CONFIG_DEFAULT,
            mensaje: "Base de datos en la nube reiniciada exitosamente",
          });
        }

        // Si hay movimientos que enviar, hacer upsert en Supabase
        if (Array.isArray(body.movimientos) && body.movimientos.length > 0) {
          const rows = body.movimientos.map(toSupabaseRow);
          await fetch(`${SUPABASE_URL}/rest/v1/movimientos`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              Prefer: "resolution=merge-duplicates",
            },
            body: JSON.stringify(rows),
          });
        }

        // Descargar la lista completa actualizada desde Supabase
        const respGet = await fetch(`${SUPABASE_URL}/rest/v1/movimientos?select=*&order=fecha_ingreso.desc`, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          cache: "no-store",
        });

        if (respGet.ok) {
          const rows = await respGet.json();
          const todos = rows.map(fromSupabaseRow);
          return NextResponse.json({
            success: true,
            provider: "supabase",
            movimientos: todos,
            configuracion: body.configuracion || CONFIG_DEFAULT,
            total: todos.length,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (sbErr) {
        console.warn("[SyncAPI] Falló sync con Supabase, usando reconciliador local:", sbErr);
      }
    }

    // B. RECONCILIADOR LOCAL (FALLBACK SIN CAÍDAS)
    const store = readStoreFallback();

    if (body.accion === "RESET") {
      const resetData = {
        movimientos: [],
        configuracion: body.configuracion || store.configuracion || CONFIG_DEFAULT,
      };
      writeStoreFallback(resetData);
      return NextResponse.json({
        success: true,
        movimientos: [],
        configuracion: resetData.configuracion,
        mensaje: "Base de datos sincronizada reiniciada a cero",
      });
    }

    const map = new Map<string, MovimientoParqueadero>();
    for (const m of store.movimientos) {
      map.set(m.id, m);
    }

    if (Array.isArray(body.movimientos)) {
      for (const clienteM of body.movimientos) {
        if (!clienteM.id) continue;
        const actual = map.get(clienteM.id);
        if (!actual) {
          map.set(clienteM.id, clienteM);
        } else {
          const fechaActual = new Date(actual.fechaActualizacion || actual.fechaIngreso).getTime();
          const fechaCliente = new Date(clienteM.fechaActualizacion || clienteM.fechaIngreso).getTime();
          if (fechaCliente >= fechaActual) {
            map.set(clienteM.id, clienteM);
          }
        }
      }
    }

    const mergedMovimientos = Array.from(map.values()).sort((a, b) => {
      return new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime();
    });

    const mergedConfig = body.configuracion || store.configuracion;
    writeStoreFallback({
      movimientos: mergedMovimientos,
      configuracion: mergedConfig,
    });

    return NextResponse.json({
      success: true,
      provider: "local-store",
      movimientos: mergedMovimientos,
      configuracion: mergedConfig,
      total: mergedMovimientos.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[SyncAPI] Error al procesar sync:", err);
    return NextResponse.json(
      { success: false, error: "Error interno al sincronizar" },
      { status: 500 }
    );
  }
}
