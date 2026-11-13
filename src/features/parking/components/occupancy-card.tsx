"use client";

import React from "react";
import type { OccupancyStats } from "@/types/parking";

interface OccupancyCardProps {
  stats: OccupancyStats;
  loading?: boolean;
}

export function OccupancyCard({ stats, loading = false }: OccupancyCardProps) {
  const carAvailable = Math.max(0, stats.carCapacity - stats.carOccupied);
  const motoAvailable = Math.max(0, stats.motorcycleCapacity - stats.motorcycleOccupied);
  const carPercent = stats.carCapacity > 0 ? Math.min(100, Math.round((stats.carOccupied / stats.carCapacity) * 100)) : 0;
  const motoPercent = stats.motorcycleCapacity > 0 ? Math.min(100, Math.round((stats.motorcycleOccupied / stats.motorcycleCapacity) * 100)) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Automóviles */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">Automóviles</span>
          <span className="rounded-full bg-teal-950 px-2.5 py-0.5 text-xs font-medium text-teal-300">
            {carAvailable} cupos libres
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white">
            {loading ? "..." : stats.carOccupied}
          </span>
          <span className="text-sm font-medium text-slate-400">/ {stats.carCapacity} capacidad</span>
        </div>
        {/* Barra de progreso */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              carPercent >= 90 ? "bg-rose-500" : carPercent >= 75 ? "bg-amber-400" : "bg-teal-500"
            }`}
            style={{ width: `${carPercent}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-slate-500">{carPercent}% ocupado</p>
      </div>

      {/* Motocicletas */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Motocicletas</span>
          <span className="rounded-full bg-indigo-950 px-2.5 py-0.5 text-xs font-medium text-indigo-300">
            {motoAvailable} cupos libres
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white">
            {loading ? "..." : stats.motorcycleOccupied}
          </span>
          <span className="text-sm font-medium text-slate-400">/ {stats.motorcycleCapacity} capacidad</span>
        </div>
        {/* Barra de progreso */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              motoPercent >= 90 ? "bg-rose-500" : motoPercent >= 75 ? "bg-amber-400" : "bg-indigo-500"
            }`}
            style={{ width: `${motoPercent}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-slate-500">{motoPercent}% ocupado</p>
      </div>

      {/* Total Vehículos Dentro */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total en Parqueadero</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            En vivo
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white">
            {loading ? "..." : stats.totalOccupied}
          </span>
          <span className="text-sm font-medium text-slate-400">vehículos activos</span>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Operando en modo local (IndexedDB) con persistencia offline garantizada.
        </p>
      </div>
    </div>
  );
}
