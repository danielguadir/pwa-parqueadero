"use client";

import React, { useState } from "react";
import type { LocalParkingSession } from "@/types/parking";

interface ActiveSessionsTableProps {
  sessions: LocalParkingSession[];
  loading?: boolean;
  onViewTicket: (session: LocalParkingSession) => void;
}

function formatElapsedTime(enteredAt: string): string {
  const diffMs = Date.now() - new Date(enteredAt).getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "Menos de 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}

export function ActiveSessionsTable({
  sessions,
  loading = false,
  onViewTicket,
}: ActiveSessionsTableProps) {
  const [search, setSearch] = useState("");

  const filteredSessions = sessions.filter((s) =>
    s.plateNormalized.includes(search.trim().toUpperCase())
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
      {/* Header y Buscador */}
      <div className="border-b border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📋</span> Vehículos Dentro del Parqueadero
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-teal-300">
              {sessions.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Listado en tiempo real de estancias activas almacenadas en el dispositivo.
          </p>
        </div>

        {/* Buscador de Placa */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Filtrar por placa..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-mono uppercase text-teal-300 placeholder:font-sans placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">Placa</th>
              <th className="px-5 py-3 font-semibold">Tipo</th>
              <th className="px-5 py-3 font-semibold">Hora de Entrada</th>
              <th className="px-5 py-3 font-semibold">Tiempo Transcurrido</th>
              <th className="px-5 py-3 font-semibold">Sincronización</th>
              <th className="px-5 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  Cargando vehículos activos...
                </td>
              </tr>
            ) : filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  {search ? `No se encontraron vehículos que coincidan con "${search}".` : "No hay vehículos en el parqueadero actualmente."}
                </td>
              </tr>
            ) : (
              filteredSessions.map((session) => (
                <tr key={session.id} className="transition hover:bg-slate-800/40">
                  {/* Placa */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-white tracking-wider">
                        {session.plateNormalized}
                      </span>
                    </div>
                  </td>

                  {/* Tipo */}
                  <td className="px-5 py-3.5 text-xs text-slate-300">
                    {session.vehicleCategory === "CAR" && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-teal-950/60 px-2 py-0.5 text-teal-300 border border-teal-800/40">
                        🚘 Auto
                      </span>
                    )}
                    {session.vehicleCategory === "MOTORCYCLE" && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-950/60 px-2 py-0.5 text-indigo-300 border border-indigo-800/40">
                        🏍️ Moto
                      </span>
                    )}
                    {session.vehicleCategory === "OTHER" && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-950/60 px-2 py-0.5 text-amber-300 border border-amber-800/40">
                        🚐 Otro
                      </span>
                    )}
                  </td>

                  {/* Hora de entrada */}
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-300">
                    {new Date(session.enteredAt).toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>

                  {/* Tiempo transcurrido */}
                  <td className="px-5 py-3.5 text-xs font-semibold text-teal-400">
                    {formatElapsedTime(session.enteredAt)}
                  </td>

                  {/* Estado de sincronización */}
                  <td className="px-5 py-3.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-0.5 font-medium text-slate-300 text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      Local offline
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onViewTicket(session)}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-teal-500 hover:text-white"
                    >
                      Ver Tiquete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
