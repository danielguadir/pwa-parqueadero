"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { LocalParkingSession, OccupancyStats } from "@/types/parking";
import { OccupancyCard } from "@/features/parking/components/occupancy-card";
import { EntryForm } from "@/features/parking/components/entry-form";
import { ActiveSessionsTable } from "@/features/parking/components/active-sessions-table";
import { EntryTicketModal } from "@/features/parking/components/entry-ticket-modal";
import {
  getActiveSessions,
  getOccupancyStats,
} from "@/features/parking/services/local-entry-service";

export default function EntradasPage() {
  const [activeSessions, setActiveSessions] = useState<LocalParkingSession[]>([]);
  const [stats, setStats] = useState<OccupancyStats>({
    carOccupied: 0,
    carCapacity: 40,
    motorcycleOccupied: 0,
    motorcycleCapacity: 30,
    otherOccupied: 0,
    totalOccupied: 0,
    totalCapacity: 70,
  });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<LocalParkingSession | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Recarga manual o tras registrar una entrada
  const refreshData = useCallback(async () => {
    try {
      const [currentStats, currentSessions] = await Promise.all([
        getOccupancyStats(),
        getActiveSessions(),
      ]);
      setStats(currentStats);
      setActiveSessions(currentSessions);
    } catch (err) {
      console.error("Error al cargar datos del parqueadero:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [currentStats, currentSessions] = await Promise.all([
          getOccupancyStats(),
          getActiveSessions(),
        ]);
        if (isMounted) {
          setStats(currentStats);
          setActiveSessions(currentSessions);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error al cargar datos del parqueadero:", err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Actualización periódica de tiempos transcurridos cada 30 segundos
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleEntrySuccess = (session: LocalParkingSession) => {
    // Abrir automáticamente el tiquete para impresión o consulta
    setSelectedTicket(session);
    setToastMessage(`✓ Entrada registrada: Placa ${session.plateNormalized}`);
    refreshData();

    // Ocultar mensaje después de 4 segundos
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-8">
      {/* Encabezado del Módulo */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/20">
              Parte 1 · Módulo Funcional
            </span>
            <span className="text-xs text-slate-500">Persistencia Offline-First</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Control de Entradas
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Registro ágil de vehículos, validación de placas, emisión de tiquetes y control de ocupación en tiempo real.
          </p>
        </div>

        {/* Botón de actualización manual */}
        <div>
          <button
            type="button"
            onClick={refreshData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>↻</span> Actualizar datos
          </button>
        </div>
      </div>

      {/* Alerta / Notificación de éxito */}
      {toastMessage && (
        <div className="rounded-xl border border-teal-500/40 bg-teal-950/60 p-4 text-sm font-semibold text-teal-200 animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Tarjetas de Ocupación y Cupos */}
      <OccupancyCard stats={stats} loading={loading} />

      {/* Sección Operativa: Formulario y Tabla en vivo */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Formulario de Entrada (Columna izquierda en pantallas grandes) */}
        <div className="lg:col-span-5">
          <EntryForm onEntrySuccess={handleEntrySuccess} />
        </div>

        {/* Tabla de Vehículos Activos (Columna derecha) */}
        <div className="lg:col-span-7">
          <ActiveSessionsTable
            sessions={activeSessions}
            loading={loading}
            onViewTicket={(session) => setSelectedTicket(session)}
          />
        </div>
      </div>

      {/* Modal de Tiquete Imprimible */}
      <EntryTicketModal
        session={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
