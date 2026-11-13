import { NextResponse } from "next/server";

export async function GET() {
  const isDbConfigured = Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("host-pooler"));

  return NextResponse.json({
    service: "ParkingPayments API",
    status: "ready",
    databaseConfigured: isDbConfigured,
    message: "Consulta y auditoría de pagos activa. Las liquidaciones locales se consolidan vía /api/sync.",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      received: body,
      message: "Recepción de pago individual completada. Recomendado usar /api/sync para garantías de idempotencia offline.",
    });
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Cuerpo de solicitud inválido" }, { status: 400 });
  }
}
