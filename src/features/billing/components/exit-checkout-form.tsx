"use client";

import React, { useState, useEffect } from "react";
import type { LocalParkingSession, LocalPayment, PaymentMethod, FeeCalculationResult } from "@/types/parking";
import { PAYMENT_METHODS, PARKING_ZONES } from "@/types/parking";
import { previewSessionFee, processExitAndPayment } from "../services/billing-service";

interface ExitCheckoutFormProps {
  activeSessions: LocalParkingSession[];
  onExitSuccess: (session: LocalParkingSession, payment: LocalPayment) => void;
}

export function ExitCheckoutForm({ activeSessions, onExitSuccess }: ExitCheckoutFormProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState<LocalParkingSession | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [discount, setDiscount] = useState("");
  const [feePreview, setFeePreview] = useState<FeeCalculationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtro de placas activas para autocompletar
  const matchingSessions = searchTerm.trim()
    ? activeSessions.filter((s) => s.plateNormalized.includes(searchTerm.trim().toUpperCase()))
    : activeSessions.slice(0, 6);

  // Recalcular tarifa cada vez que se selecciona una sesión
  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    let isMounted = true;
    previewSessionFee(selectedSession).then((calc) => {
      if (isMounted) {
        setFeePreview(calc);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedSession]);

  const discountNum = Number(discount) || 0;
  const finalAmount = feePreview ? Math.max(0, feePreview.amountDue - discountNum) : 0;

  const handleSelectSession = (session: LocalParkingSession) => {
    setSelectedSession(session);
    setSearchTerm(session.plateNormalized);
    setErrorMessage(null);
  };

  const handleClearSelection = () => {
    setSelectedSession(null);
    setSearchTerm("");
    setFeePreview(null);
    setDiscount("");
    setErrorMessage(null);
  };

  const handleProcessPayment = async () => {
    if (!selectedSession) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await processExitAndPayment({
        sessionId: selectedSession.id,
        paymentMethod,
        discountCents: discountNum > 0 ? discountNum : undefined,
      });

      if (!result.success || !result.session || !result.payment) {
        setErrorMessage(result.error ?? "No se pudo procesar la salida.");
      } else {
        handleClearSelection();
        onExitSuccess(result.session, result.payment);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error inesperado al registrar salida.");
    } finally {
      setIsProcessing(false);
    }
  };

  const zoneObj = selectedSession ? PARKING_ZONES.find((z) => z.id === selectedSession.zone) : null;
  const zoneName = zoneObj ? zoneObj.label : "Zona Central";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-4 sm:p-6 shadow-xl">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>💳</span> Registrar Salida y Cobro
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Busca la placa, confirma el valor calculado por tiempo y libera el cupo.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {/* Buscador de placa para cobro */}
        <div>
          <label htmlFor="search-plate-exit" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Buscar Placa para Salida
          </label>
          <div className="relative mt-1.5">
            <input
              id="search-plate-exit"
              type="text"
              autoComplete="off"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value.toUpperCase());
                if (selectedSession && selectedSession.plateNormalized !== e.target.value.toUpperCase()) {
                  setSelectedSession(null);
                  setFeePreview(null);
                }
              }}
              placeholder="Escribe la placa (ej: ABC123)..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-xl font-bold uppercase tracking-widest text-teal-300 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-600 focus:border-teal-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="absolute right-3 top-3 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Sugerencias rápidas si no ha seleccionado una placa fija */}
          {!selectedSession && matchingSessions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[11px] text-slate-500 py-1">Vehículos activos:</span>
              {matchingSessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSession(s)}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-mono font-bold text-white hover:border-teal-400 hover:bg-slate-700 active:scale-95 transition"
                >
                  {s.plateNormalized}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tarjeta de Liquidación de la Estancia Seleccionada */}
        {selectedSession && feePreview ? (
          <div className="rounded-2xl border border-teal-500/30 bg-slate-950/70 p-4 space-y-3 animate-fadeIn">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-teal-400">Placa Seleccionada</span>
                <div className="font-mono text-3xl font-black text-white tracking-wider">
                  {selectedSession.plateNormalized}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedSession.vehicleCategory === "CAR" ? "Automóvil" : selectedSession.vehicleCategory === "MOTORCYCLE" ? "Motocicleta" : "Otro"} · 📍 {zoneName}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Total a Pagar</span>
                <div className="text-3xl font-black text-teal-300">
                  ${finalAmount.toLocaleString("es-CO")}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">COP</span>
              </div>
            </div>

            {/* Desglose de Tiempo y Tarifa */}
            <div className="rounded-xl bg-slate-900/90 p-3 text-xs space-y-1.5 border border-slate-800">
              <div className="flex justify-between text-slate-300">
                <span>Tiempo transcurrido:</span>
                <span className="font-bold text-teal-300">{feePreview.totalMinutes} minutos ({Math.floor(feePreview.totalMinutes / 60)}h {feePreview.totalMinutes % 60}m)</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Cálculo tarifario:</span>
                <span className="italic">{feePreview.breakdown}</span>
              </div>
              {feePreview.isGracePeriod && (
                <div className="rounded bg-emerald-950/60 text-emerald-300 p-1 text-center font-medium">
                  ✓ Salida dentro del periodo de gracia (Sin costo)
                </div>
              )}
            </div>

            {/* Selector de Medio de Pago */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Medio de Pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition active:scale-95 ${
                      paymentMethod === m.id
                        ? "border-teal-400 bg-teal-950/70 text-white ring-1 ring-teal-400"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Descuento opcional */}
            <div>
              <label htmlFor="discount-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Descuento en Pesos <span className="text-[10px] text-slate-500 normal-case">(Opcional)</span>
              </label>
              <input
                id="discount-input"
                type="number"
                min="0"
                step="100"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-teal-500 focus:outline-none"
              />
            </div>

            {/* Errores */}
            {errorMessage && (
              <div className="rounded-xl border border-rose-800 bg-rose-950/60 p-2.5 text-xs text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* Botón principal de Cobro */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleProcessPayment}
              className="w-full rounded-xl bg-teal-500 py-3.5 px-4 text-sm sm:text-base font-bold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:bg-teal-400 active:scale-98 disabled:opacity-50"
            >
              {isProcessing
                ? "Procesando cobro..."
                : `✓ Cobrar $${finalAmount.toLocaleString("es-CO")} y Liberar Cupo`}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
            {activeSessions.length === 0
              ? "No hay vehículos actualmente dentro del parqueadero para registrar salida."
              : "Selecciona o busca una placa activa arriba para liquidar su tiempo y pago."}
          </div>
        )}
      </div>
    </div>
  );
}
