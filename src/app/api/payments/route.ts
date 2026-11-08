import { NextResponse } from "next/server";

// No se procesan solicitudes reales antes de implementar validación, permisos y persistencia.
export async function GET() {
  return NextResponse.json({ error: "NOT_IMPLEMENTED", message: "Gestión de pagos pendiente" }, { status: 501 });
}
export async function POST() {
  return NextResponse.json({ error: "NOT_IMPLEMENTED", message: "Gestión de pagos pendiente" }, { status: 501 });
}
