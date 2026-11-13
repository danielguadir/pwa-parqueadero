"use client";

import React, { useState, useEffect } from "react";
import type { LocalParkingSession, LocalPayment, ParkingSettings } from "@/types/parking";
import { PARKING_ZONES } from "@/types/parking";
import { downloadExitReceiptPdf } from "@/lib/pdf/ticket-pdf-generator";
import { getParkingSettings } from "@/lib/db/local-db";

interface ExitReceiptModalProps {
  session: LocalParkingSession | null;
  payment: LocalPayment | null;
  onClose: () => void;
}

export function ExitReceiptModal({ session, payment, onClose }: ExitReceiptModalProps) {
  const [settings, setSettings] = useState<ParkingSettings | null>(null);

  useEffect(() => {
    let active = true;
    getParkingSettings().then((res) => {
      if (active) setSettings(res);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!session) return null;

  const receiptCode = `RC-${session.id.slice(0, 8).toUpperCase()}`;
  const totalAmount = (payment?.amountCents ?? session.totalCents ?? 0).toLocaleString("es-CO");

  const entryDate = new Date(session.enteredAt);
  const exitDate = session.exitedAt ? new Date(session.exitedAt) : new Date();

  const diffMs = exitDate.getTime() - entryDate.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  const durationStr = `${hours}h ${mins}m`;

  const zoneObj = PARKING_ZONES.find((z) => z.id === session.zone);
  const zoneLabel = zoneObj ? zoneObj.label : "Zona Central";

  const methodLabel =
    payment?.method === "CASH"
      ? "💵 Efectivo"
      : payment?.method === "NEQUI_DAVIPLATA"
      ? "📱 Nequi / Daviplata"
      : payment?.method === "CARD"
      ? "💳 Tarjeta"
      : "🏷️ Otro";

  const handleDownloadPdf = () => {
    downloadExitReceiptPdf(session, payment ?? undefined, undefined, settings || undefined);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm print:p-0 print:bg-white"
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 text-slate-100 shadow-2xl print:border-none print:bg-white print:text-black print:p-2 print:shadow-none">
        {/* Encabezado */}
        <div className="border-b border-dashed border-slate-700 pb-3 text-center print:border-neutral-400">
          <p className="text-base sm:text-lg font-bold tracking-tight text-white print:text-black">
            ▣ {settings?.name ? settings.name.toUpperCase() : "PARKINGCONTROL"}
          </p>
          <p className="text-[11px] text-slate-400 print:text-neutral-600">
            {settings?.nit ? `NIT: ${settings.nit}` : "Recibo de Salida y Pago"}
          </p>
          <p className="mt-0.5 font-mono text-xs font-semibold text-teal-400 print:text-neutral-800">
            {receiptCode}
          </p>
        </div>

        {/* Detalles */}
        <div className="my-4 space-y-2.5">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-center print:border-black print:bg-neutral-100">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 print:text-neutral-700">
              Vehículo Retirado
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-teal-300 print:text-black">
              {session.plateNormalized}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {session.vehicleCategory === "CAR" ? "Automóvil" : session.vehicleCategory === "MOTORCYCLE" ? "Motocicleta" : "Otro"} · {zoneLabel}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-800/50 p-2.5 print:bg-transparent print:border print:border-neutral-300">
              <span className="text-slate-400 print:text-neutral-600">Tiempo Total</span>
              <p className="font-semibold text-white print:text-black">{durationStr}</p>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-2.5 print:bg-transparent print:border print:border-neutral-300">
              <span className="text-slate-400 print:text-neutral-600">Medio Pago</span>
              <p className="font-semibold text-teal-300 print:text-black">{methodLabel}</p>
            </div>
          </div>

          <div className="rounded-xl border border-teal-500/30 bg-teal-950/40 p-3 text-center print:border-black print:bg-neutral-100">
            <span className="text-[11px] uppercase tracking-wider text-teal-300 font-semibold print:text-neutral-800">
              Total Cobrado
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white print:text-black mt-0.5">
              ${totalAmount} <span className="text-xs font-normal text-slate-400">COP</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1 rounded-lg bg-slate-950/40 p-2.5 border border-slate-800/60">
            <div className="flex justify-between">
              <span>Ingreso:</span>
              <span className="font-mono text-slate-300">{entryDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex justify-between">
              <span>Salida:</span>
              <span className="font-mono text-slate-300">{exitDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        </div>

        {/* Términos */}
        <div className="border-t border-dashed border-slate-700 pt-2.5 text-center text-[10px] text-slate-500 print:border-neutral-400 print:text-neutral-600">
          <p>Cupo liberado exitosamente en el sistema.</p>
        </div>

        {/* Acciones */}
        <div className="mt-4 space-y-2 print:hidden">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 px-4 text-xs sm:text-sm font-bold text-slate-950 transition hover:bg-teal-400 active:scale-95 shadow-md shadow-teal-500/20"
          >
            <span>📥</span>
            <span>Descargar Recibo en PDF</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 px-3 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 active:scale-95"
            >
              🖨️ Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 active:scale-95"
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
