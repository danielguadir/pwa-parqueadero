"use client";

import React, { useState } from "react";
import type { LocalParkingSession } from "@/types/parking";
import { PARKING_ZONES } from "@/types/parking";

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

function getZoneShort(zoneId?: string): string {
  if (!zoneId) return "Central";
  const found = PARKING_ZONES.find((z) => z.id === zoneId);
  return found ? found.short : "Central";
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
      <div className="border-b border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>📋</span> Vehículos Dentro
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-teal-300">
              {sessions.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Estancias activas en el dispositivo con zona asignada.
          </p>
        </div>

        {/* Buscador de Placa */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Buscar por placa..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono uppercase text-teal-300 placeholder:font-sans placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Vista de Tarjetas para Celular + Tabla para Escritorio */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">Placa</th>
              <th className="px-5 py-3 font-semibold">Tipo</th>
              <th className="px-5 py-3 font-semibold">Zona</th>
              <th className="px-5 py-3 font-semibold">Hora Ingreso</th>
              <th className="px-5 py-3 font-semibold">Tiempo</th>
              <th className="px-5 py-3 font-semibold text-right">Acción</th>
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
                  {search ? `No hay resultados para "${search}".` : "No hay vehículos en el parqueadero actualmente."}
                </td>
              </tr>
            ) : (
              filteredSessions.map((session) => (
                <tr key={session.id} className="transition hover:bg-slate-800/40">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-base font-bold text-white tracking-wider">
                      {session.plateNormalized}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-300">
                    {session.vehicleCategory === "CAR" ? "🚘 Auto" : session.vehicleCategory === "MOTORCYCLE" ? "🏍️ Moto" : "🚐 Otro"}
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 font-medium text-teal-300 border border-slate-700">
                      📍 {getZoneShort(session.zone)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-300">
                    {new Date(session.enteredAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-teal-400">
                    {formatElapsedTime(session.enteredAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onViewTicket(session)}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-teal-500 hover:text-white"
                    >
                      Tiquete PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Lista Móvil en Tarjetas (Mobile First) */}
      <div className="sm:hidden divide-y divide-slate-800/80">
        {loading ? (
          <p className="p-4 text-center text-xs text-slate-500">Cargando...</p>
        ) : filteredSessions.length === 0 ? (
          <p className="p-4 text-center text-xs text-slate-500">
            {search ? `No hay resultados para "${search}".` : "No hay vehículos en el parqueadero."}
          </p>
        ) : (
          filteredSessions.map((session) => (
            <div key={session.id} className="p-3.5 flex items-center justify-between gap-2 active:bg-slate-800/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-black text-white tracking-wider">
                    {session.plateNormalized}
                  </span>
                  <span className="text-xs">
                    {session.vehicleCategory === "CAR" ? "🚘" : session.vehicleCategory === "MOTORCYCLE" ? "🏍️" : "🚐"}
                  </span>
                  <span className="rounded bg-teal-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-teal-300 border border-teal-800/40">
                    {getZoneShort(session.zone)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Ingreso: {new Date(session.enteredAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span>·</span>
                  <span className="font-semibold text-teal-400">{formatElapsedTime(session.enteredAt)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onViewTicket(session)}
                className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-teal-300 active:bg-slate-700"
              >
                PDF
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
