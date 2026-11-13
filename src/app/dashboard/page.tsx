"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getOccupancyStats } from "@/features/parking/services/local-entry-service";
import type { OccupancyStats } from "@/types/parking";

const modules = [
  {
    title: "Entradas",
    href: "/entradas",
    description: "Registro rápido, validación de placas y emisión de tiquetes",
    badge: "Operativo",
    badgeColor: "bg-teal-950 text-teal-300 border-teal-800/40",
  },
  {
    title: "Salidas",
    href: "/salidas",
    description: "Cierre de estancia, cálculo de tiempo y cobro de tarifa",
    badge: "Parte 2",
    badgeColor: "bg-slate-800 text-slate-400 border-slate-700",
  },
  {
    title: "Historial",
    href: "/historial",
    description: "Consultas paginadas por placa, fecha y tipo de vehículo",
    badge: "Parte 2",
    badgeColor: "bg-slate-800 text-slate-400 border-slate-700",
  },
  {
    title: "Tarifas",
    href: "/tarifas",
    description: "Configuración de precios por bloque, minutos y categorías",
    badge: "Parte 2",
    badgeColor: "bg-slate-800 text-slate-400 border-slate-700",
  },
  {
    title: "Reportes",
    href: "/reportes",
    description: "Métricas de recaudo, ocupación promedio y auditoría",
    badge: "Parte 3",
    badgeColor: "bg-slate-800 text-slate-400 border-slate-700",
  },
  {
    title: "Usuarios",
    href: "/usuarios",
    description: "Administración de turnos, operadores y permisos",
    badge: "Parte 3",
    badgeColor: "bg-slate-800 text-slate-400 border-slate-700",
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<OccupancyStats | null>(null);

  useEffect(() => {
    getOccupancyStats()
      .then((res) => setStats(res))
      .catch((err) => console.error("Error al cargar stats en dashboard:", err));
  }, []);

  const totalOccupied = stats?.totalOccupied ?? 0;
  const totalFree = stats ? Math.max(0, stats.totalCapacity - stats.totalOccupied) : 70;

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-teal-400">
            ParkingControl · v0.2
          </p>
          <span className="rounded-full bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            Parte 1 Activa
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl text-white">
          Panel de Parqueadero
        </h1>
        <p className="mt-2 max-w-3xl text-slate-400 text-sm">
          Sistema de gestión vehicular con arquitectura offline-first. Monitoreo en tiempo real de ocupación local y acceso modular.
        </p>
      </div>

      {/* Contadores Principales en Vivo */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Vehículos Dentro */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Vehículos Dentro
            </p>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white">
            {stats ? totalOccupied : "0"}
          </p>
          <p className="mt-1 text-xs text-teal-400">
            {stats ? `${stats.carOccupied} carros · ${stats.motorcycleOccupied} motos` : "Consultando almacenamiento local..."}
          </p>
        </div>

        {/* Cupos Libres */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cupos Disponibles
            </p>
            <span className="rounded-full bg-teal-950/80 px-2 py-0.5 text-[11px] font-medium text-teal-300">
              Total: {stats?.totalCapacity ?? 70}
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-teal-300">
            {stats ? totalFree : "70"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {stats ? `${stats.carCapacity - stats.carOccupied} autos · ${stats.motorcycleCapacity - stats.motorcycleOccupied} motos libres` : "Capacidad nominal"}
          </p>
        </div>

        {/* Estado Operativo */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Operación Offline-First
          </p>
          <p className="mt-3 text-lg font-bold text-emerald-400 flex items-center gap-2">
            <span>⚡</span> Módulo de Entradas Activo
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Almacenamiento transaccional en IndexedDB listo para operar sin red.
          </p>
        </div>
      </div>

      {/* Acceso Rápido a Módulos */}
      <div>
        <h2 className="mb-3 text-xl font-bold text-white">Módulos del Sistema</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {modules.map((m) => (
            <Link
              href={m.href}
              key={m.href}
              className="group rounded-xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-teal-500/50 hover:bg-slate-900 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white group-hover:text-teal-300 transition">
                  {m.title} <span aria-hidden className="text-teal-400 transition group-hover:translate-x-1 inline-block">→</span>
                </h3>
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${m.badgeColor}`}>
                  {m.badge}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{m.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Banner Informativo de Ruta */}
      <div className="rounded-xl border border-teal-900/50 bg-teal-950/20 p-4 text-xs text-teal-200/90 flex items-center justify-between">
        <span>
          <strong>Parte 1 Implementada:</strong> Registro de entradas, validación de placas, emisión de tiquetes y cupos en tiempo real.
        </span>
        <Link href="/entradas" className="font-semibold underline hover:text-white ml-2">
          Ir a Entradas →
        </Link>
      </div>
    </div>
  );
}
