"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { LocalParkingSession } from "@/types/parking";
import { PARKING_ZONES } from "@/types/parking";
import { getHistoricalSessions } from "@/features/billing/services/billing-service";
import { downloadEntryTicketPdf, downloadExitReceiptPdf } from "@/lib/pdf/ticket-pdf-generator";

function getZoneShort(zoneId?: string): string {
  if (!zoneId) return "Central";
  const found = PARKING_ZONES.find((z) => z.id === zoneId);
  return found ? found.short : "Central";
}

export default function HistorialPage() {
  const [sessions, setSessions] = useState<LocalParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlate, setFilterPlate] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const loadData = useCallback(async () => {
    try {
      const data = await getHistoricalSessions({
        plate: filterPlate || undefined,
        status: filterStatus !== "ALL" ? filterStatus : undefined,
        category: filterCategory !== "ALL" ? filterCategory : undefined,
      });
      setSessions(data);
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setLoading(false);
    }
  }, [filterPlate, filterStatus, filterCategory]);

  useEffect(() => {
    let isMounted = true;
    getHistoricalSessions({
      plate: filterPlate || undefined,
      status: filterStatus !== "ALL" ? filterStatus : undefined,
      category: filterCategory !== "ALL" ? filterCategory : undefined,
    }).then((data) => {
      if (isMounted) {
        setSessions(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [filterPlate, filterStatus, filterCategory]);

  const totalCollected = sessions
    .filter((s) => s.status === "CLOSED" && s.totalCents)
    .reduce((acc, curr) => acc + (curr.totalCents ?? 0), 0);

  const closedCount = sessions.filter((s) => s.status === "CLOSED").length;
  const openCount = sessions.filter((s) => s.status === "OPEN").length;

  const handleDownloadPdf = (session: LocalParkingSession) => {
    if (session.status === "CLOSED") {
      downloadExitReceiptPdf(session);
    } else {
      downloadEntryTicketPdf(session);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/20">
              Parte 2 · Auditoría
            </span>
            <span className="text-xs text-slate-500">Historial Completo</span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Historial de Estancias
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
            Consulta estancias activas y finalizadas, recaudos y descarga de tiquetes en PDF.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <span>↻</span> Refrescar
          </button>
        </div>
      </div>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3 sm:p-4 shadow-sm">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400">Total Filtrados</span>
          <p className="text-xl sm:text-3xl font-extrabold text-white mt-1">{sessions.length}</p>
          <span className="text-[10px] text-teal-400">{openCount} dentro · {closedCount} cerrados</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3 sm:p-4 shadow-sm">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400">Recaudo Filtrado</span>
          <p className="text-xl sm:text-3xl font-extrabold text-teal-300 mt-1">${totalCollected.toLocaleString("es-CO")}</p>
          <span className="text-[10px] text-slate-500">Total liquidado</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3 sm:p-4 shadow-sm">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400">Almacenamiento</span>
          <p className="text-sm sm:text-lg font-bold text-emerald-400 mt-1">IndexedDB</p>
          <span className="text-[10px] text-slate-400">100% Offline</span>
        </div>
      </div>

      {/* Filtros Móviles */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 shadow-sm">
        <div className="grid gap-2.5 sm:grid-cols-12">
          {/* Búsqueda por placa */}
          <div className="sm:col-span-6">
            <input
              type="text"
              value={filterPlate}
              onChange={(e) => setFilterPlate(e.target.value.toUpperCase())}
              placeholder="Filtrar por placa..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-mono uppercase text-teal-300 placeholder:font-sans placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Filtro por Estado */}
          <div className="sm:col-span-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="OPEN">Solo Activos (Dentro)</option>
              <option value="CLOSED">Solo Finalizados (Cobrados)</option>
            </select>
          </div>

          {/* Filtro por Categoría */}
          <div className="sm:col-span-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="CAR">Automóviles</option>
              <option value="MOTORCYCLE">Motocicletas</option>
              <option value="OTHER">Otros</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista en Tarjetas (Mobile) y Tabla (Desktop) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        {/* Tabla Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Placa</th>
                <th className="px-5 py-3 font-semibold">Categoría</th>
                <th className="px-5 py-3 font-semibold">Zona</th>
                <th className="px-5 py-3 font-semibold">Ingreso</th>
                <th className="px-5 py-3 font-semibold">Salida</th>
                <th className="px-5 py-3 font-semibold">Total Cobrado</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    Cargando historial...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    No se encontraron registros en el historial.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="transition hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-mono font-bold text-white tracking-wider">
                      {s.plateNormalized}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-300">
                      {s.vehicleCategory === "CAR" ? "🚘 Auto" : s.vehicleCategory === "MOTORCYCLE" ? "🏍️ Moto" : "🚐 Otro"}
                    </td>
                    <td className="px-5 py-3 text-xs text-teal-300">
                      📍 {getZoneShort(s.zone)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-300">
                      {new Date(s.enteredAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-300">
                      {s.exitedAt ? new Date(s.exitedAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    </td>
                    <td className="px-5 py-3 font-bold text-teal-300">
                      {s.totalCents !== null && s.totalCents !== undefined ? `$${s.totalCents.toLocaleString("es-CO")}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {s.status === "OPEN" ? (
                        <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-emerald-400 font-semibold text-[11px] border border-emerald-800/40">
                          Activo Dentro
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300 font-medium text-[11px]">
                          Finalizado
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(s)}
                        className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-teal-300 hover:border-teal-400 hover:text-white transition"
                      >
                        📥 PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tarjetas Mobile */}
        <div className="sm:hidden divide-y divide-slate-800/80">
          {loading ? (
            <p className="p-4 text-center text-xs text-slate-500">Cargando...</p>
          ) : sessions.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-500">No hay registros con los filtros seleccionados.</p>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="p-3.5 space-y-1.5 active:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black text-white">{s.plateNormalized}</span>
                    <span className="text-xs">{s.vehicleCategory === "CAR" ? "🚘" : s.vehicleCategory === "MOTORCYCLE" ? "🏍️" : "🚐"}</span>
                    <span className="rounded bg-teal-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-teal-300 border border-teal-800/40">
                      {getZoneShort(s.zone)}
                    </span>
                  </div>

                  {s.status === "OPEN" ? (
                    <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-emerald-400 font-bold text-[10px] border border-emerald-800/40">
                      DENTRO
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-teal-300 text-sm">
                      ${(s.totalCents ?? 0).toLocaleString("es-CO")}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Ingreso: {new Date(s.enteredAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    {s.exitedAt && ` → Salida: ${new Date(s.exitedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(s)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-bold text-teal-300 active:bg-slate-700"
                  >
                    📥 PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
