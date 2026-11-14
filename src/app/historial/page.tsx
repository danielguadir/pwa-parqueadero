"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  obtenerHistorial,
  marcarPagoPendiente,
} from "@/features/parking/services/movimientos-service";
import type { MovimientoParqueadero, FiltroHistorial } from "@/types/movimiento";

export default function HistorialPage() {
  const [filtro, setFiltro] = useState<FiltroHistorial>("TODOS");
  const [movimientos, setMovimientos] = useState<MovimientoParqueadero[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  const cargarDatos = useCallback(async (f: FiltroHistorial) => {
    setCargando(true);
    try {
      const data = await obtenerHistorial(f);
      setMovimientos(data);
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => {
      if (activo) cargarDatos(filtro);
    });
    return () => {
      activo = false;
    };
  }, [filtro, cargarDatos]);

  // Total efectivamente recaudado calculado ÚNICAMENTE con los registros marcados como PAGADO
  const totalEfectivamenteRecaudado = movimientos.reduce((acc, m) => {
    return m.estadoPago === "PAGADO" ? acc + m.tarifaAplicada : acc;
  }, 0);

  const handleMarcarPagado = async (m: MovimientoParqueadero) => {
    setActualizandoId(m.id);
    try {
      await marcarPagoPendiente(m.id);
      await cargarDatos(filtro);
    } catch (err) {
      alert("Error al actualizar pago: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setActualizandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-700/60 pb-3">
        <div>
          <h1 className="text-2xl font-black text-white">Historial y Control de Pagos</h1>
          <p className="text-xs text-slate-400">Auditoría completa de vehículos y recaudos del evento</p>
        </div>

        {/* Resumen Financiero: Solo Cobros Pagados */}
        <div className="rounded-2xl border border-teal-500/30 bg-teal-950/30 px-4 py-2 sm:text-right">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
            Total Efectivamente Recaudado
          </span>
          <p className="font-mono text-2xl font-black text-emerald-400">
            ${totalEfectivamenteRecaudado.toLocaleString("es-CO")} COP
          </p>
          <p className="text-[10px] text-slate-400">Calculado solo sobre registros pagados</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "TODOS", label: "Todos" },
          { id: "DENTRO", label: "Dentro" },
          { id: "RETIRADOS", label: "Retirados" },
          { id: "PAGADOS", label: "Pagados" },
          { id: "PENDIENTES", label: "Pendientes" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id as FiltroHistorial)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              filtro === f.id
                ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla de Movimientos */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center text-xs text-slate-400">Cargando registros...</div>
        ) : movimientos.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No hay vehículos que coincidan con el filtro seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-3">Placa</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Propietario</th>
                  <th className="py-3 px-3">Ingreso</th>
                  <th className="py-3 px-3">Salida</th>
                  <th className="py-3 px-3 text-right">Tarifa</th>
                  <th className="py-3 px-3 text-center">Vehículo</th>
                  <th className="py-3 px-3 text-center">Pago</th>
                  <th className="py-3 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {movimientos.map((m) => {
                  const estaDentro = m.estadoVehiculo === "DENTRO";
                  const esPagado = m.estadoPago === "PAGADO";

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">
                        {m.placaNormalizada}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {m.tipoVehiculo === "CARRO" ? "🚗 Carro" : "🏍️ Moto"}
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        <div className="font-semibold">{m.nombre}</div>
                        {(m.celular || m.cedula) && (
                          <div className="text-[10px] text-slate-400">
                            {m.cedula ? `CC: ${m.cedula} ` : ""}
                            {m.celular ? `Tel: ${m.celular}` : ""}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(m.fechaIngreso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {m.fechaSalida
                          ? new Date(m.fechaSalida).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
                          : "-"}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        ${m.tarifaAplicada.toLocaleString("es-CO")}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            estaDentro
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800/40"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {estaDentro ? "DENTRO" : "RETIRADO"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            esPagado
                              ? "bg-teal-950 text-teal-300 border border-teal-800/40"
                              : "bg-rose-950 text-rose-300 border border-rose-800/40"
                          }`}
                        >
                          {esPagado ? "PAGADO" : "PENDIENTE"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {!esPagado ? (
                          <button
                            type="button"
                            disabled={actualizandoId === m.id}
                            onClick={() => handleMarcarPagado(m)}
                            className="rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal-500 disabled:opacity-50"
                          >
                            {actualizandoId === m.id ? "..." : "Marcar Pagado"}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500">Al día</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>Mostrando {movimientos.length} registros en total.</span>
        <Link href="/configuracion" className="underline hover:text-white">
          Exportar a CSV o hacer copia de seguridad →
        </Link>
      </div>
    </div>
  );
}
