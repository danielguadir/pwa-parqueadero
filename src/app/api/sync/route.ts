import { NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { MovimientoParqueadero, ConfiguracionParqueadero } from "@/types/movimiento";

const DATA_DIR = join(process.cwd(), "data");
const STORE_FILE = join(DATA_DIR, "sync-store.json");

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

function readStore(): {
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
  } catch (err) {
    console.error("[SyncAPI] Error al leer store:", err);
    return { movimientos: [], configuracion: CONFIG_DEFAULT };
  }
}

function writeStore(data: {
  movimientos: MovimientoParqueadero[];
  configuracion: ConfiguracionParqueadero;
}) {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[SyncAPI] Error al escribir store:", err);
  }
}

export async function GET() {
  const store = readStore();
  return NextResponse.json({
    success: true,
    movimientos: store.movimientos,
    configuracion: store.configuracion,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SyncPayload;
    const store = readStore();

    // 1. Acción especial: RESET / Depurar datos de prueba
    if (body.accion === "RESET") {
      const resetData = {
        movimientos: [],
        configuracion: body.configuracion || store.configuracion || CONFIG_DEFAULT,
      };
      writeStore(resetData);
      return NextResponse.json({
        success: true,
        movimientos: [],
        configuracion: resetData.configuracion,
        mensaje: "Base de datos sincronizada reiniciada a cero",
      });
    }

    // 2. Sincronización bidireccional (merge por id y fechaActualizacion)
    const map = new Map<string, MovimientoParqueadero>();

    // Primero agregamos los del servidor
    for (const m of store.movimientos) {
      map.set(m.id, m);
    }

    // Reconciliamos los que envía el cliente
    if (Array.isArray(body.movimientos)) {
      for (const clienteM of body.movimientos) {
        if (!clienteM.id) continue;
        const actual = map.get(clienteM.id);
        if (!actual) {
          map.set(clienteM.id, clienteM);
        } else {
          // Si el registro del cliente es más reciente o igual, lo actualizamos
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

    writeStore({
      movimientos: mergedMovimientos,
      configuracion: mergedConfig,
    });

    return NextResponse.json({
      success: true,
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
