"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { obtenerResumenInicio } from "@/features/parking/services/movimientos-service";
import type { ResumenInicio } from "@/types/movimiento";

export function InicioDashboard() {
  const [resumen, setResumen] = useState<ResumenInicio>({
    vehiculosDentro: 0,
    totalIngresados: 0,
    vehiculosRetirados: 0,
    totalRecaudado: 0,
    pagosPendientes: 0,
  });
  const [cargando, setCargando] = useState<boolean>(true);

  const cargarResumen = useCallback(async () => {
    try {
      const data = await obtenerResumenInicio();
      setResumen(data);
    } catch (err) {
      console.error("Error al cargar resumen:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => {
      if (activo) cargarResumen();
    });
    return () => {
      activo = false;
    };
  }, [cargarResumen]);

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="border-b border-slate-700/60 pb-4">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Control de Parqueadero
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-400">
          Operación rápida offline-first para evento de fin de semana.
        </p>
      </div>

      {/* Botones Principales de Operación */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Link
            href="/entradas"
            className="flex flex-col items-center justify-center rounded-2xl bg-emerald-600 px-6 py-5 text-center text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 active:scale-98 touch-manipulation"
          >
            <span className="text-3xl sm:text-4xl">🚗 🏍️ ➕</span>
            <span className="mt-2 text-xl sm:text-2xl font-black uppercase tracking-wider">
              Ingresar Vehículo
            </span>
            <span className="text-xs text-emerald-100 font-medium mt-0.5">
              Registrar entrada y asignar tarifa fija
            </span>
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/entradas?tipo=CARRO"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 py-2.5 px-3 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40 active:scale-95 transition"
            >
              <span>🚗</span> Carro ($4.000)
            </Link>
            <Link
              href="/entradas?tipo=MOTO"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 py-2.5 px-3 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40 active:scale-95 transition"
            >
              <span>🏍️</span> Moto ($1.500)
            </Link>
          </div>
        </div>

        <div className="flex flex-col">
          <Link
            href="/salidas"
            className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-amber-600 px-6 py-5 text-center text-white shadow-lg shadow-amber-900/30 transition hover:bg-amber-500 active:scale-98 touch-manipulation"
          >
            <span className="text-3xl sm:text-4xl">💳 ➖</span>
            <span className="mt-2 text-xl sm:text-2xl font-black uppercase tracking-wider">
              Retirar Vehículo
            </span>
            <span className="text-xs text-amber-100 font-medium mt-0.5">
              Buscar placa, cobrar y autorizar salida
            </span>
          </Link>
        </div>
      </div>

      {/* 5 Tarjetas de Métricas Clave */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          Estado Actual del Parqueadero
        </h2>

        {cargando ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400">
            Cargando estado local...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            {/* 1. Dentro */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Vehículos Dentro
              </p>
              <p className="mt-2 text-3xl sm:text-4xl font-black text-white">
                {resumen.vehiculosDentro}
              </p>
              <p className="mt-1 text-xs text-slate-400 font-medium">Actualmente dentro</p>
            </div>

            {/* 2. Total Ingresados */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Ingresados
              </p>
              <p className="mt-2 text-3xl sm:text-4xl font-black text-white">
                {resumen.totalIngresados}
              </p>
              <p className="mt-1 text-xs text-slate-400 font-medium">Total del evento</p>
            </div>

            {/* 3. Retirados */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Vehículos Retirados
              </p>
              <p className="mt-2 text-3xl sm:text-4xl font-black text-white">
                {resumen.vehiculosRetirados}
              </p>
              <p className="mt-1 text-xs text-slate-400 font-medium">Salidas confirmadas</p>
            </div>

            {/* 4. Total Recaudado */}
            <div className="rounded-2xl border border-teal-500/30 bg-teal-950/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                Total Recaudado
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-400">
                ${resumen.totalRecaudado.toLocaleString("es-CO")}
              </p>
              <p className="mt-1 text-xs text-slate-400 font-medium">Solo cobros pagados</p>
            </div>

            {/* 5. Pagos Pendientes */}
            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                Pagos Pendientes
              </p>
              <p className="mt-2 text-3xl sm:text-4xl font-black text-rose-400">
                {resumen.pagosPendientes}
              </p>
              <p className="mt-1 text-xs text-slate-400 font-medium">Vehículos por cobrar</p>
            </div>
          </div>
        )}
      </div>

      {/* Enlaces Rápidos a Historial y Configuración */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-xs font-semibold text-slate-300">
        <span>¿Necesitas auditar registros o descargar copias?</span>
        <div className="flex gap-2">
          <Link
            href="/historial"
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 transition hover:bg-slate-700"
          >
            📜 Ver Historial Completo
          </Link>
          <Link
            href="/configuracion"
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 transition hover:bg-slate-700"
          >
            ⚙️ Tarifas y Respaldos
          </Link>
        </div>
      </div>
    </div>
  );
}
