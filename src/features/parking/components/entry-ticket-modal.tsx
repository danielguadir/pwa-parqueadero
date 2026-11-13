"use client";

import React from "react";
import type { LocalParkingSession } from "@/types/parking";
import { PARKING_ZONES } from "@/types/parking";
import { downloadEntryTicketPdf } from "@/lib/pdf/ticket-pdf-generator";

interface EntryTicketModalProps {
  session: LocalParkingSession | null;
  onClose: () => void;
}

export function EntryTicketModal({ session, onClose }: EntryTicketModalProps) {
  if (!session) return null;

  const ticketCode = `TK-${session.id.slice(0, 8).toUpperCase()}`;
  const dateFormatted = new Date(session.enteredAt).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const categoryName =
    session.vehicleCategory === "CAR"
      ? "AUTOMÓVIL"
      : session.vehicleCategory === "MOTORCYCLE"
      ? "MOTOCICLETA"
      : "OTRO";

  const zoneObj = PARKING_ZONES.find((z) => z.id === session.zone);
  const zoneLabel = zoneObj ? zoneObj.label : "Zona Central";

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    downloadEntryTicketPdf(session);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm print:p-0 print:bg-white"
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 text-slate-100 shadow-2xl print:border-none print:bg-white print:text-black print:p-2 print:shadow-none">
        {/* Encabezado del Ticket */}
        <div className="border-b border-dashed border-slate-700 pb-3 text-center print:border-neutral-400">
          <p className="text-base sm:text-lg font-bold tracking-tight text-white print:text-black">▣ PARKINGCONTROL</p>
          <p className="text-[11px] text-slate-400 print:text-neutral-600">Sistema Profesional de Parqueadero</p>
          <p className="mt-1 font-mono text-xs font-semibold text-teal-400 print:text-neutral-800">
            {ticketCode}
          </p>
        </div>

        {/* Detalles del Vehículo */}
        <div className="my-4 space-y-2.5">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-center print:border-black print:bg-neutral-100">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 print:text-neutral-700">
              Placa del Vehículo
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-teal-300 print:text-black">
              {session.plateNormalized}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-800/50 p-2.5 print:bg-transparent print:border print:border-neutral-300">
              <span className="text-slate-400 print:text-neutral-600">Categoría</span>
              <p className="font-semibold text-white print:text-black">{categoryName}</p>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-2.5 print:bg-transparent print:border print:border-neutral-300">
              <span className="text-slate-400 print:text-neutral-600">Zona Parqueo</span>
              <p className="font-semibold text-teal-300 print:text-black">{zoneLabel}</p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-800/50 p-2.5 text-xs print:bg-transparent print:border print:border-neutral-300">
            <span className="text-slate-400 print:text-neutral-600">Fecha y Hora de Ingreso</span>
            <p className="font-mono font-medium text-white print:text-black">{dateFormatted}</p>
          </div>

          {session.notes && (
            <div className="rounded-lg bg-slate-800/50 p-2.5 text-xs print:bg-transparent print:border print:border-neutral-300">
              <span className="text-slate-400 print:text-neutral-600">Observaciones</span>
              <p className="italic text-slate-300 print:text-neutral-800">{session.notes}</p>
            </div>
          )}
        </div>

        {/* Términos resumidos */}
        <div className="border-t border-dashed border-slate-700 pt-3 text-center text-[10px] text-slate-500 print:border-neutral-400 print:text-neutral-600">
          <p>Conserve este comprobante para retirar su vehículo.</p>
          <p>Documento digital verificado.</p>
        </div>

        {/* Acciones para Móvil y Escritorio (Ocultas en impresión) */}
        <div className="mt-5 space-y-2 print:hidden">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 px-4 text-xs sm:text-sm font-bold text-slate-950 transition hover:bg-teal-400 active:scale-95 shadow-md shadow-teal-500/20"
          >
            <span>📥</span>
            <span>Descargar Tiquete en PDF</span>
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
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
