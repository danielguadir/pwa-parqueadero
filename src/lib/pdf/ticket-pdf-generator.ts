import type { LocalParkingSession, LocalPayment, ParkingZone } from "@/types/parking";
import { PARKING_ZONES } from "@/types/parking";

function sanitizeText(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve acentos para compatibilidad estándar PDF Type1
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function getZoneLabel(zone?: ParkingZone): string {
  if (!zone) return "Zona Central A";
  const found = PARKING_ZONES.find((z) => z.id === zone);
  return found ? found.label : "Zona Central";
}

/**
 * Genera un documento PDF binario estándar (PDF 1.4) optimizado para formato recibo (80mm).
 * Funciona 100% offline sin librerías externas pesadas.
 */
function createReceiptPdf(lines: { text: string; size: number; bold?: boolean; align?: "center" | "left" | "right"; y: number }[], height: number = 420): Uint8Array {
  const width = 226; // Ancho térmico estándar ~80mm en puntos tipográficos

  let stream = "";
  // Fondo o líneas de diseño
  stream += "0.5 w\n"; // Grosor de línea
  stream += "[2 2] 0 d\n"; // Líneas punteadas
  stream += `15 ${height - 65} m ${width - 15} ${height - 65} l S\n`;
  stream += `15 75 m ${width - 15} 75 l S\n`;
  stream += "[] 0 d\n"; // Restablecer línea continua

  for (const item of lines) {
    const font = item.bold ? "/F2" : "/F1";
    const sanitized = sanitizeText(item.text);

    // Estimación aproximada de ancho para centrado
    const charWidth = item.size * (item.bold ? 0.6 : 0.52);
    const textWidth = sanitized.length * charWidth;
    let x = 18;

    if (item.align === "center") {
      x = Math.max(10, (width - textWidth) / 2);
    } else if (item.align === "right") {
      x = Math.max(10, width - 18 - textWidth);
    }

    stream += `BT\n${font} ${item.size} Tf\n${x.toFixed(1)} ${item.y.toFixed(1)} Td\n(${sanitized}) Tj\nET\n`;
  }

  const streamBytes = new TextEncoder().encode(stream);
  const streamLen = streamBytes.length;

  let header = "%PDF-1.4\n";
  const offsets: number[] = [];

  function addObj(content: string): void {
    offsets.push(new TextEncoder().encode(header).length);
    header += content + "\n";
  }

  addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  addObj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");
  addObj(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj`
  );
  addObj("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");
  addObj("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj");
  addObj(`6 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}\nendstream\nendobj`);

  const xrefStart = new TextEncoder().encode(header).length;
  let trailer = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;

  for (const off of offsets) {
    trailer += `${off.toString().padStart(10, "0")} 00000 n \n`;
  }

  trailer += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const fullPdf = header + trailer;
  return new TextEncoder().encode(fullPdf);
}

/**
 * Dispara la descarga del PDF en el navegador del cliente o dispositivo móvil.
 */
export function downloadPdf(bytes: Uint8Array, filename: string): void {
  if (typeof window === "undefined") return;
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Genera y descarga el tiquete de entrada en formato PDF.
 */
export function downloadEntryTicketPdf(session: LocalParkingSession): void {
  const code = `TK-${session.id.slice(0, 8).toUpperCase()}`;
  const entryDate = new Date(session.enteredAt);
  const dateStr = entryDate.toLocaleDateString("es-CO");
  const timeStr = entryDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const categoryStr = session.vehicleCategory === "CAR" ? "AUTOMOVIL" : session.vehicleCategory === "MOTORCYCLE" ? "MOTOCICLETA" : "OTRO";
  const zoneStr = getZoneLabel(session.zone);

  const lines = [
    { text: "PARKINGCONTROL", size: 14, bold: true, align: "center" as const, y: 395 },
    { text: "SISTEMA DE GESTION VEHICULAR", size: 7, bold: false, align: "center" as const, y: 382 },
    { text: `TIQUETE DE ENTRADA: ${code}`, size: 8, bold: true, align: "center" as const, y: 368 },

    { text: "PLACA:", size: 8, bold: false, align: "center" as const, y: 335 },
    { text: session.plateNormalized, size: 22, bold: true, align: "center" as const, y: 310 },
    { text: `TIPO: ${categoryStr}`, size: 9, bold: true, align: "center" as const, y: 290 },

    { text: `ZONA ASIGNADA:`, size: 8, bold: false, align: "left" as const, y: 260 },
    { text: zoneStr.toUpperCase(), size: 10, bold: true, align: "left" as const, y: 247 },

    { text: `FECHA DE INGRESO:`, size: 8, bold: false, align: "left" as const, y: 220 },
    { text: `${dateStr} - ${timeStr}`, size: 9, bold: true, align: "left" as const, y: 207 },

    { text: `ESTADO: ACTIVO DENTRO`, size: 9, bold: true, align: "left" as const, y: 180 },
    ...(session.notes ? [{ text: `OBS: ${session.notes.slice(0, 32)}`, size: 8, bold: false, align: "left" as const, y: 160 }] : []),

    { text: "CONSERVE ESTE TIQUETE", size: 9, bold: true, align: "center" as const, y: 55 },
    { text: "Se requiere para retirar su vehiculo.", size: 7, bold: false, align: "center" as const, y: 43 },
    { text: "Perdida de tiquete genera costo adicional.", size: 6, bold: false, align: "center" as const, y: 32 },
    { text: code, size: 7, bold: false, align: "center" as const, y: 18 },
  ];

  const pdfBytes = createReceiptPdf(lines, 430);
  downloadPdf(pdfBytes, `Tiquete_Entrada_${session.plateNormalized}.pdf`);
}

/**
 * Genera y descarga el recibo de salida y pago en formato PDF.
 */
export function downloadExitReceiptPdf(session: LocalParkingSession, payment?: LocalPayment, totalFormatted?: string): void {
  const code = `RC-${session.id.slice(0, 8).toUpperCase()}`;
  const entryDate = new Date(session.enteredAt);
  const exitDate = session.exitedAt ? new Date(session.exitedAt) : new Date();

  const entryStr = `${entryDate.toLocaleDateString("es-CO")} ${entryDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;
  const exitStr = `${exitDate.toLocaleDateString("es-CO")} ${exitDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;

  const diffMs = exitDate.getTime() - entryDate.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  const durationStr = `${hours}h ${mins}m (${diffMinutes} min)`;

  const totalAmount = totalFormatted ?? `$ ${(payment?.amountCents ?? session.totalCents ?? 0).toLocaleString("es-CO")} COP`;
  const methodLabel = payment?.method === "CASH" ? "EFECTIVO" : payment?.method === "NEQUI_DAVIPLATA" ? "NEQUI / DAVIPLATA" : payment?.method === "CARD" ? "TARJETA / DATAFONO" : "OTRO";
  const categoryStr = session.vehicleCategory === "CAR" ? "AUTOMOVIL" : session.vehicleCategory === "MOTORCYCLE" ? "MOTOCICLETA" : "OTRO";
  const zoneStr = getZoneLabel(session.zone);

  const lines = [
    { text: "PARKINGCONTROL", size: 14, bold: true, align: "center" as const, y: 460 },
    { text: "RECIBO DE SALIDA Y PAGO", size: 8, bold: true, align: "center" as const, y: 445 },
    { text: `COMPROBANTE: ${code}`, size: 7, bold: false, align: "center" as const, y: 432 },

    { text: "VEHICULO RETIRADO:", size: 8, bold: false, align: "center" as const, y: 405 },
    { text: session.plateNormalized, size: 22, bold: true, align: "center" as const, y: 380 },
    { text: `TIPO: ${categoryStr} | ZONA: ${zoneStr}`, size: 8, bold: false, align: "center" as const, y: 362 },

    { text: `ENTRADA:`, size: 7, bold: false, align: "left" as const, y: 335 },
    { text: entryStr, size: 8, bold: true, align: "left" as const, y: 323 },

    { text: `SALIDA:`, size: 7, bold: false, align: "left" as const, y: 305 },
    { text: exitStr, size: 8, bold: true, align: "left" as const, y: 293 },

    { text: `TIEMPO ESTANCIA:`, size: 7, bold: false, align: "left" as const, y: 275 },
    { text: durationStr, size: 9, bold: true, align: "left" as const, y: 263 },

    { text: `METODO DE PAGO:`, size: 7, bold: false, align: "left" as const, y: 245 },
    { text: methodLabel, size: 9, bold: true, align: "left" as const, y: 233 },

    { text: "TOTAL PAGADO:", size: 9, bold: false, align: "center" as const, y: 195 },
    { text: totalAmount, size: 16, bold: true, align: "center" as const, y: 175 },

    { text: "ESTADO: SALIDA COMPLETADA", size: 8, bold: true, align: "center" as const, y: 140 },

    { text: "GRACIAS POR SU VISITA", size: 9, bold: true, align: "center" as const, y: 55 },
    { text: "Comprobante digital valido.", size: 7, bold: false, align: "center" as const, y: 43 },
    { text: code, size: 7, bold: false, align: "center" as const, y: 25 },
  ];

  const pdfBytes = createReceiptPdf(lines, 490);
  downloadPdf(pdfBytes, `Recibo_Salida_${session.plateNormalized}.pdf`);
}
