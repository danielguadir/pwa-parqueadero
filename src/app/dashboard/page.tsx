"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getOccupancyStats } from "@/features/parking/services/local-entry-service";
import { getDailyBillingSummary } from "@/features/billing/services/billing-service";
import type { OccupancyStats, DailyBillingSummary } from "@/types/parking";

const modules = [
  {
    title: "Entradas",
    href: "/entradas",
    description: "Registro rápido, asignación de zona y tiquete descargable en PDF",
    badge: "Operativo",
    badgeColor: "bg-teal-950 text-teal-300 border-teal-800/40",
  },
  {
    title: "Salidas",
    href: "/salidas",
    description: "Cierre de estancia, cálculo automático de tiempo y recibo en PDF",
    badge: "Operativo",
    badgeColor: "bg-teal-950 text-teal-300 border-teal-800/40",
  },
  {
    title: "Tarifas",
    href: "/tarifas",
    description: "Configuración de precios por categoría, gracia y fraccionamiento",
    badge: "Operativo",
    badgeColor: "bg-teal-950 text-teal-300 border-teal-800/40",
  },
  {
    title: "Historial",
    href: "/historial",
    description: "Auditoría de estancias, arqueo de turno y re-emisión de PDF",
    badge: "Operativo",
    badgeColor: "bg-teal-950 text-teal-300 border-teal-800/40",
  },
  {
    title: "Reportes",
    href: "/reportes",
    description: "Métricas consolidadas de recaudo, ocupación y exportación",
    badge: "Operativo",
    badgeColor: "bg-teal-950 text-teal-300 border-teal-800/40",
  },
  {
    title: "Operadores",
    href: "/usuarios",
    description: "Administración de turnos, operadores y permisos",
    badge: "Operativo",
    badgeColor: "bg-teal-950 text-teal-300 border-teal-800/40",
  },
  {
    title: "Configuración",
    href: "/configuracion",
    description: "Modificar cupos máximos (carros/motos), nombre y datos de tiquetes",
    badge: "Operativo",
    badgeColor: "bg-teal-950 text-teal-300 border-teal-800/40",
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<OccupancyStats | null>(null);
  const [billing, setBilling] = useState<DailyBillingSummary | null>(null);

  useEffect(() => {
    Promise.all([getOccupancyStats(), getDailyBillingSummary()])
      .then(([statsRes, billRes]) => {
        setStats(statsRes);
        setBilling(billRes);
      })
      .catch((err) => console.error("Error al cargar stats en dashboard:", err));
  }, []);

  const totalOccupied = stats?.totalOccupied ?? 0;
  const totalFree = stats ? Math.max(0, stats.totalCapacity - stats.totalOccupied) : 70;

  return (
    <div className="space-y-6 sm:space-y-7">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-teal-400">
            ParkingControl · v0.3
          </p>
          <span className="rounded-full bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            Parte 1 y 2 Operativas
          </span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          Panel de Parqueadero
        </h1>
        <p className="mt-1 max-w-3xl text-slate-400 text-xs sm:text-sm">
          Operación ágil para móvil y escritorio. Entradas por zona, salidas con liquidación de tiempo y persistencia offline en IndexedDB.
        </p>
      </div>

      {/* Contadores Principales en Vivo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Vehículos Dentro */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Vehículos Dentro
            </p>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-white">
            {stats ? totalOccupied : "0"}
          </p>
          <p className="mt-0.5 text-[11px] text-teal-400">
            {stats ? `${stats.carOccupied} autos · ${stats.motorcycleOccupied} motos` : "Consultando local..."}
          </p>
        </div>

        {/* Cupos Libres */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cupos Libres
            </p>
            <span className="rounded-full bg-teal-950/80 px-2 py-0.5 text-[10px] font-medium text-teal-300">
              {stats?.totalCapacity ?? 70} máx
            </span>
          </div>
          <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-teal-300">
            {stats ? totalFree : "70"}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {stats ? `${stats.carCapacity - stats.carOccupied} autos · ${stats.motorcycleCapacity - stats.motorcycleOccupied} motos` : "Disponible"}
          </p>
        </div>

        {/* Recaudo de Hoy */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Recaudo Hoy
            </p>
            <span className="text-xs">💰</span>
          </div>
          <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-white">
            ${(billing?.totalRevenue ?? 0).toLocaleString("es-CO")}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-400">
            {billing?.totalCompletedSessions ?? 0} salidas liquidadas
          </p>
        </div>
      </div>

      {/* Acceso Rápido a Módulos */}
      <div>
        <h2 className="mb-2 sm:mb-3 text-lg sm:text-xl font-bold text-white">Módulos del Sistema</h2>
        <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
          {modules.map((m) => (
            <Link
              href={m.href}
              key={m.href}
              className="group rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 transition hover:border-teal-500/50 hover:bg-slate-900 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm sm:text-base text-white group-hover:text-teal-300 transition">
                  {m.title} <span aria-hidden className="text-teal-400 transition group-hover:translate-x-1 inline-block">→</span>
                </h3>
                <span className={`rounded-md border px-2 py-0.5 text-[10px] sm:text-[11px] font-medium ${m.badgeColor}`}>
                  {m.badge}
                </span>
              </div>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-400">{m.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Acceso Directo Rápido a Operación */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/entradas"
          className="rounded-xl bg-teal-500 p-3.5 sm:p-4 text-center font-bold text-slate-950 hover:bg-teal-400 active:scale-98 transition shadow-md shadow-teal-500/20 text-xs sm:text-sm"
        >
          🚘 Registrar Nueva Entrada
        </Link>
        <Link
          href="/salidas"
          className="rounded-xl border border-teal-500/40 bg-slate-900 p-3.5 sm:p-4 text-center font-bold text-teal-300 hover:bg-slate-800 active:scale-98 transition text-xs sm:text-sm"
        >
          💳 Registrar Salida y Cobro
        </Link>
      </div>
    </div>
  );
}
