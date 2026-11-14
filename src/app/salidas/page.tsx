"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  buscarParaRetiro,
  registrarRetiro,
  marcarPagoPendiente,
} from "@/features/parking/services/movimientos-service";
import type { MovimientoParqueadero, EstadoPago } from "@/types/movimiento";

export default function SalidasPage() {
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState<MovimientoParqueadero[]>([]);
  const [seleccionado, setSeleccionado] = useState<MovimientoParqueadero | null>(null);

  const [procesando, setProcesando] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorRetiro, setErrorRetiro] = useState<string | null>(null);

  const ejecutarBusqueda = useCallback(async (query: string) => {
    try {
      const res = await buscarParaRetiro(query);
      setResultados(res);
      // Si el seleccionado sigue en los resultados, actualizarlo; de lo contrario deseleccionar si se retiró
      setSeleccionado((prev) => {
        if (!prev) return null;
        const actualizado = res.find((r) => r.id === prev.id);
        return actualizado || null;
      });
    } catch (err) {
      console.error("Error en búsqueda:", err);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => {
      if (activo) ejecutarBusqueda(termino);
    });
    return () => {
      activo = false;
    };
  }, [termino, ejecutarBusqueda]);

  const handleRetiro = async (estadoPago: EstadoPago) => {
    if (!seleccionado || procesando) return;

    setProcesando(true);
    setErrorRetiro(null);
    setMensajeExito(null);

    try {
      const res = await registrarRetiro(seleccionado.id, estadoPago);
      if (!res.success || !res.movimiento) {
        setErrorRetiro(res.error || "No se pudo procesar el retiro.");
        setProcesando(false);
        return;
      }

      setMensajeExito(
        `✓ Retiro completado para placa ${res.movimiento.placaNormalizada}: Estado de pago [${res.movimiento.estadoPago}]`
      );
      setSeleccionado(null);
      await ejecutarBusqueda(termino);
    } catch (err) {
      setErrorRetiro(err instanceof Error ? err.message : "Error al guardar retiro en IndexedDB");
    } finally {
      setProcesando(false);
    }
  };

  const handleMarcarPagado = async (m: MovimientoParqueadero) => {
    if (procesando) return;
    setProcesando(true);
    setErrorRetiro(null);
    setMensajeExito(null);

    try {
      const res = await marcarPagoPendiente(m.id);
      if (!res.success || !res.movimiento) {
        setErrorRetiro(res.error || "No se pudo actualizar el pago.");
        setProcesando(false);
        return;
      }

      setMensajeExito(`✓ Pago registrado para placa ${res.movimiento.placaNormalizada}. Salida histórica conservada.`);
      setSeleccionado(null);
      await ejecutarBusqueda(termino);
    } catch (err) {
      setErrorRetiro(err instanceof Error ? err.message : "Error al actualizar pago.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div>
          <h1 className="text-2xl font-black text-white">Retiro de Vehículo</h1>
          <p className="text-xs text-slate-400">Buscar por placa, nombre o cédula para cobrar y dar salida</p>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700"
        >
          ← Volver
        </Link>
      </div>

      {/* Mensajes de Confirmación y Error */}
      {mensajeExito && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-sm font-bold text-emerald-300">
          {mensajeExito}
        </div>
      )}

      {errorRetiro && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm font-bold text-rose-300">
          ❌ {errorRetiro}
        </div>
      )}

      {/* Barra de Búsqueda Rápida */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          Búsqueda Rápida (Placa, Nombre o Cédula)
        </label>
        <div className="relative">
          <input
            type="text"
            autoFocus
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            placeholder="Escribe la placa (ej: ABC123), nombre o cédula..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base font-semibold text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none"
          />
          {termino && (
            <button
              type="button"
              onClick={() => setTermino("")}
              className="absolute right-3 top-3 text-xs font-bold text-slate-400 hover:text-white"
            >
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Modal / Panel de Detalle del Vehículo Seleccionado */}
      {seleccionado && (
        <div className="rounded-2xl border-2 border-amber-500/60 bg-slate-900 p-5 shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-300 uppercase">
                {seleccionado.tipoVehiculo}
              </span>
              <h2 className="mt-1 font-mono text-3xl font-black text-white">
                {seleccionado.placaNormalizada}
              </h2>
              <p className="text-sm font-semibold text-slate-300">{seleccionado.nombre}</p>
              {seleccionado.cedula && <p className="text-xs text-slate-400">CC: {seleccionado.cedula}</p>}
              {seleccionado.celular && <p className="text-xs text-slate-400">Tel: {seleccionado.celular}</p>}
            </div>

            <button
              type="button"
              onClick={() => setSeleccionado(null)}
              className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              Cerrar
            </button>
          </div>

          <div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-950 p-3 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Ingreso:</span>
              <p className="font-semibold text-slate-200">
                {new Date(seleccionado.fechaIngreso).toLocaleString("es-CO")}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Tarifa Fija:</span>
              <p className="font-mono text-lg font-black text-emerald-400">
                ${seleccionado.tarifaAplicada.toLocaleString("es-CO")} COP
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Estado del Vehículo:</span>
              <p className="font-bold text-white">
                {seleccionado.estadoVehiculo === "DENTRO" ? "🟢 DENTRO" : "⚪ RETIRADO"}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Estado del Pago:</span>
              <p className="font-bold">
                {seleccionado.estadoPago === "PAGADO" ? (
                  <span className="text-emerald-400">✓ PAGADO</span>
                ) : (
                  <span className="text-rose-400">⏳ PENDIENTE</span>
                )}
              </p>
            </div>
          </div>

          {/* Opciones de Acción */}
          {seleccionado.estadoVehiculo === "DENTRO" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={procesando}
                onClick={() => handleRetiro("PAGADO")}
                className="rounded-xl bg-emerald-600 py-3.5 text-sm font-black uppercase text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 active:scale-98 disabled:opacity-50"
              >
                {procesando ? "Guardando..." : "1. RETIRAR — PAGADO"}
              </button>

              <button
                type="button"
                disabled={procesando}
                onClick={() => handleRetiro("PENDIENTE")}
                className="rounded-xl bg-rose-700 py-3.5 text-sm font-black uppercase text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-600 active:scale-98 disabled:opacity-50"
              >
                {procesando ? "Guardando..." : "2. RETIRAR — PAGO PENDIENTE"}
              </button>
            </div>
          ) : seleccionado.estadoPago === "PENDIENTE" ? (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-center">
              <p className="text-xs text-rose-300 font-medium mb-3">
                Este vehículo ya fue retirado, pero tiene el pago PENDIENTE.
              </p>
              <button
                type="button"
                disabled={procesando}
                onClick={() => handleMarcarPagado(seleccionado)}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-black uppercase text-white hover:bg-emerald-500"
              >
                {procesando ? "Guardando..." : "Marcar como PAGADO ahora"}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center text-xs text-slate-400">
              Vehículo retirado y pagado previamente. No requiere acciones.
            </div>
          )}
        </div>
      )}

      {/* Lista de Resultados de Vehículos */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Resultados ({resultados.length} vehículos)
        </h2>

        {resultados.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-xs text-slate-500">
            No se encontraron vehículos que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {resultados.map((m) => {
              const estaDentro = m.estadoVehiculo === "DENTRO";
              const esPagado = m.estadoPago === "PAGADO";
              const esSeleccionado = seleccionado?.id === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => setSeleccionado(m)}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    esSeleccionado
                      ? "border-amber-400 bg-slate-900 shadow-md shadow-amber-500/10"
                      : "border-slate-800 bg-slate-900/70 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-black text-white">
                      {m.placaNormalizada}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        estaDentro
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {estaDentro ? "DENTRO" : "RETIRADO"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs font-semibold text-slate-200 truncate">{m.nombre}</p>

                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      {m.tipoVehiculo === "CARRO" ? "🚗 Carro" : "🏍️ Moto"} · ${m.tarifaAplicada.toLocaleString("es-CO")}
                    </span>
                    <span className={`font-bold ${esPagado ? "text-emerald-400" : "text-rose-400"}`}>
                      {esPagado ? "PAGADO" : "PENDIENTE"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
