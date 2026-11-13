"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { getLocalDb } from "@/lib/db/local-db";
import type {
  LocalParkingSession,
  LocalPayment,
  ReportPeriod,
} from "@/types/parking";
import {
  filterSessionsByPeriod,
  calculateConsolidatedMetrics,
  generateCsvReport,
} from "../domain/report-calculator";

export function ReportsDashboard() {
  const [sessions, setSessions] = useState<LocalParkingSession[]>([]);
  const [payments, setPayments] = useState<LocalPayment[]>([]);
  const [period, setPeriod] = useState<ReportPeriod>("TODAY");
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      const db = getLocalDb();
      const allSessions = await db.sessions.toArray();
      const allPayments = await db.payments.toArray();
      setSessions(allSessions);
      setPayments(allPayments);
    } catch (err) {
      console.error("Error cargando datos de reporte:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadData();
      }
    });
    return () => {
      active = false;
    };
  }, [loadData]);

  const filteredSessions = useMemo(() => {
    return filterSessionsByPeriod(sessions, period);
  }, [sessions, period]);

  const metrics = useMemo(() => {
    return calculateConsolidatedMetrics(filteredSessions, payments, period);
  }, [filteredSessions, payments, period]);

  const handleDownloadCsv = () => {
    const csvContent = generateCsvReport(metrics, filteredSessions);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Reporte_ParkingControl_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm font-medium text-slate-400">Calculando métricas del parqueadero...</p>
      </div>
    );
  }

  const cashPercent = metrics.totalRevenue > 0 ? Math.round((metrics.cashTotal / metrics.totalRevenue) * 100) : 0;
  const transferPercent = metrics.totalRevenue > 0 ? Math.round((metrics.transferTotal / metrics.totalRevenue) * 100) : 0;
  const cardPercent = metrics.totalRevenue > 0 ? Math.round((metrics.cardTotal / metrics.totalRevenue) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Encabezado y Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reportes y Cuadre de Caja</h1>
          <p className="mt-1 text-sm text-slate-400">
            Analítica financiera, volumen de vehículos y arqueo por medios de pago.
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-300 transition hover:bg-teal-500/20 active:scale-95"
          >
            📥 Descargar CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 active:scale-95"
          >
            🖨️ Imprimir Reporte
          </button>
        </div>
      </div>

      {/* Selector de Periodo */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {[
          { id: "TODAY", label: "Hoy" },
          { id: "WEEK", label: "Últimos 7 días" },
          { id: "MONTH", label: "Este mes" },
          { id: "ALL", label: "Todo el histórico" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPeriod(item.id as ReportPeriod)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              period === item.id
                ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Tarjetas Principales (KPIs) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Recaudado</p>
          <p className="mt-2 text-2xl font-black text-emerald-400 sm:text-3xl">
            ${metrics.totalRevenue.toLocaleString("es-CO")}
          </p>
          <p className="mt-1 text-xs text-slate-500">Ingresos liquidados</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vehículos Atendidos</p>
          <p className="mt-2 text-2xl font-black text-white sm:text-3xl">
            {metrics.totalSessions}
          </p>
          <p className="mt-1 text-xs text-slate-500">Salidas completadas</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Efectivo en Caja</p>
          <p className="mt-2 text-2xl font-black text-teal-300 sm:text-3xl">
            ${metrics.cashTotal.toLocaleString("es-CO")}
          </p>
          <p className="mt-1 text-xs text-slate-500">{cashPercent}% del recaudo</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ticket Promedio</p>
          <p className="mt-2 text-2xl font-black text-amber-300 sm:text-3xl">
            ${metrics.averageTicket.toLocaleString("es-CO")}
          </p>
          <p className="mt-1 text-xs text-slate-500">Por vehículo cerrado</p>
        </div>
      </div>

      {/* Desglose por Medio de Pago y Tipo de Vehículo */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Arqueo por Medio de Pago */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Arqueo por Método de Pago
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">💵 Efectivo</span>
                <span className="text-teal-300">
                  ${metrics.cashTotal.toLocaleString("es-CO")} ({cashPercent}%)
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-500"
                  style={{ width: `${cashPercent}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">📱 Nequi / Daviplata</span>
                <span className="text-purple-300">
                  ${metrics.transferTotal.toLocaleString("es-CO")} ({transferPercent}%)
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{ width: `${transferPercent}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">💳 Tarjeta / Datáfono</span>
                <span className="text-blue-300">
                  ${metrics.cardTotal.toLocaleString("es-CO")} ({cardPercent}%)
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${cardPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Distribución por Tipo de Vehículo */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Volumen por Tipo de Vehículo
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
              <span className="text-xl">🚗</span>
              <p className="mt-1 text-xs text-slate-400">Carros</p>
              <p className="text-lg font-bold text-white">{metrics.carCount}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
              <span className="text-xl">🏍️</span>
              <p className="mt-1 text-xs text-slate-400">Motos</p>
              <p className="text-lg font-bold text-white">{metrics.motoCount}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
              <span className="text-xl">🚚</span>
              <p className="mt-1 text-xs text-slate-400">Otros</p>
              <p className="text-lg font-bold text-white">{metrics.otherCount}</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-400">
            ℹ️ <strong className="text-slate-300">Nota operativa:</strong> Las tarifas por defecto aplicadas fueron de $4.000 COP para automóviles y $1.500 COP para motocicletas.
          </div>
        </div>
      </div>

      {/* Tabla Resumen de Movimientos Recientes */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Últimos Movimientos del Periodo ({filteredSessions.length} registros)
        </h2>

        {filteredSessions.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500">No hay movimientos registrados en este periodo.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Placa</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Zona</th>
                  <th className="py-2.5 px-3">Entrada</th>
                  <th className="py-2.5 px-3">Salida</th>
                  <th className="py-2.5 px-3 text-right">Cobrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSessions.slice(0, 10).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{s.plateNormalized}</td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {s.vehicleCategory === "CAR" ? "Carro" : s.vehicleCategory === "MOTORCYCLE" ? "Moto" : "Otro"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{s.zone?.replace(/_/g, " ") || "Central A"}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(s.enteredAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {s.exitedAt
                        ? new Date(s.exitedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
                        : "En parqueadero"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                      ${(s.totalCents ?? s.agreedRate ?? 4000).toLocaleString("es-CO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
