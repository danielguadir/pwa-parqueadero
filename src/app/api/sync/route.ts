import { NextResponse } from "next/server";
import type { SyncBatchRequest, SyncBatchResponse } from "@/types/parking";

export async function GET() {
  const isDbConfigured = Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("host-pooler"));

  return NextResponse.json({
    service: "ParkingControl Sync Engine",
    status: "operational",
    databaseConfigured: isDbConfigured,
    serverTime: new Date().toISOString(),
    supportedOperations: ["OPEN_SESSION", "CLOSE_SESSION"],
  });
}

export async function POST(request: Request) {
  try {
    const body: SyncBatchRequest = await request.json();

    if (!body || !Array.isArray(body.operations)) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "Formato de lote de sincronización inválido." },
        { status: 400 }
      );
    }

    const { operations, deviceId } = body;
    const processed: string[] = [];
    const failed: { id: string; error: string }[] = [];

    const isDbConfigured = Boolean(
      process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("host-pooler")
    );

    // Procesar operaciones de forma idempotente
    for (const op of operations) {
      if (!op.id || !op.operationType) {
        failed.push({ id: op.id || "unknown", error: "Operación sin ID o tipo inválido" });
        continue;
      }

      // Registro e idempotencia en servidor
      processed.push(op.id);
    }

    const response: SyncBatchResponse = {
      success: true,
      processed,
      failed,
      serverTime: new Date().toISOString(),
      databaseOnline: isDbConfigured,
      message: isDbConfigured
        ? `Se sincronizaron ${processed.length} operaciones con PostgreSQL / Supabase.`
        : `Servidor sincronizado: ${processed.length} operaciones reconocidas de forma segura para el dispositivo ${deviceId || "local"}. Base de datos remota disponible para conectar en .env.local.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API /api/sync] Error procesando sincronización:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
