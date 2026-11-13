"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { LocalParkingSession, LocalPayment, DailyBillingSummary } from "@/types/parking";
import { ExitCheckoutForm } from "@/features/billing/components/exit-checkout-form";
import { ExitReceiptModal } from "@/features/billing/components/exit-receipt-modal";
import { DailySummaryCard } from "@/features/billing/components/daily-summary-card";
import { getActiveSessions } from "@/features/parking/services/local-entry-service";
import { getDailyBillingSummary } from "@/features/billing/services/billing-service";

export default function SalidasPage() {
  const [activeSessions, setActiveSessions] = useState<LocalParkingSession[]>([]);
  const [summary, setSummary] = useState<DailyBillingSummary>({
    date: new Date().toLocaleDateString("es-CO"),
    totalRevenue: 0,
    totalCompletedSessions: 0,
    cashRevenue: 0,
    transferRevenue: 0,
    cardRevenue: 0,
    otherRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [completedExit, setCompletedExit] = useState<{
    session: LocalParkingSession;
    payment: LocalPayment;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [sessions, currentSummary] = await Promise.all([
        getActiveSessions(),
        getDailyBillingSummary(),
      ]);
      setActiveSessions(sessions);
      setSummary(currentSummary);
    } catch (err) {
      console.error("Error al cargar datos de salidas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const [sessions, currentSummary] = await Promise.all([
          getActiveSessions(),
          getDailyBillingSummary(),
        ]);
        if (isMounted) {
          setActiveSessions(sessions);
          setSummary(currentSummary);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error al inicializar salidas:", err);
        if (isMounted) setLoading(false);
      }
    };

    init();
    const interval = setInterval(init, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleExitSuccess = (session: LocalParkingSession, payment: LocalPayment) => {
    setCompletedExit({ session, payment });
    setToastMessage(`✓ Salida procesada con éxito: Placa ${session.plateNormalized} ($${payment.amountCents.toLocaleString("es-CO")})`);
    loadData();

    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/20">
              Parte 2 · Módulo Funcional
            </span>
            <span className="text-xs text-slate-500">Cobro y Liquidación Local</span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Salidas y Facturación
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
            Cálculo de tarifas en tiempo real, múltiples medios de pago y recibos descargables en PDF.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <span>↻</span> Actualizar
          </button>
        </div>
      </div>

      {/* Alerta de Éxito */}
      {toastMessage && (
        <div className="rounded-xl border border-teal-500/40 bg-teal-950/70 p-3.5 text-xs sm:text-sm font-semibold text-teal-200 animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Arqueo de Turno / Métricas de Hoy */}
      <DailySummaryCard summary={summary} loading={loading} />

      {/* Formulario de Salida */}
      <div className="max-w-2xl mx-auto">
        <ExitCheckoutForm
          activeSessions={activeSessions}
          onExitSuccess={handleExitSuccess}
        />
      </div>

      {/* Modal con Recibo de Salida y Descarga PDF */}
      <ExitReceiptModal
        session={completedExit?.session ?? null}
        payment={completedExit?.payment ?? null}
        onClose={() => setCompletedExit(null)}
      />
    </div>
  );
}
