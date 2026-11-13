"use client";

import React from "react";
import type { DailyBillingSummary } from "@/types/parking";

interface DailySummaryCardProps {
  summary: DailyBillingSummary;
  loading?: boolean;
}

export function DailySummaryCard({ summary, loading = false }: DailySummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">Arqueo de Turno / Hoy</span>
          <p className="text-xs text-slate-400">Total liquidado en caja local ({summary.date})</p>
        </div>
        <span className="rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-800/40">
          {summary.totalCompletedSessions} salidas
        </span>
      </div>

      <div>
        <span className="text-xs text-slate-400">Recaudo Total Acumulado</span>
        <div className="text-3xl font-black text-white tracking-tight mt-0.5">
          {loading ? "..." : `$${summary.totalRevenue.toLocaleString("es-CO")}`}{" "}
          <span className="text-sm font-normal text-slate-400">COP</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-3 text-xs">
        <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
          <span className="text-slate-400 text-[10px] block">💵 Efectivo</span>
          <span className="font-bold text-slate-200">
            ${summary.cashRevenue.toLocaleString("es-CO")}
          </span>
        </div>

        <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
          <span className="text-slate-400 text-[10px] block">📱 Transferencias</span>
          <span className="font-bold text-teal-300">
            ${summary.transferRevenue.toLocaleString("es-CO")}
          </span>
        </div>

        <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
          <span className="text-slate-400 text-[10px] block">💳 Tarjetas</span>
          <span className="font-bold text-slate-200">
            ${summary.cardRevenue.toLocaleString("es-CO")}
          </span>
        </div>
      </div>
    </div>
  );
}
