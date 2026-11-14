"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  obtenerConfiguracionEvento,
  guardarConfiguracionEvento,
  generarCsvMovimientos,
  generarRespaldoJson,
  restaurarRespaldoJson,
} from "@/features/parking/services/movimientos-service";
import { solicitarAlmacenamientoPersistente } from "@/lib/db/storage-persistence";
import type { ConfiguracionParqueadero } from "@/types/movimiento";

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfiguracionParqueadero>({
    tarifaCarro: 4000,
    tarifaMoto: 1500,
    nombreEvento: "Evento Fin de Semana",
    ultimaCopiaSeguridad: null,
  });

  const [tarifaCarroInput, setTarifaCarroInput] = useState<number>(4000);
  const [tarifaMotoInput, setTarifaMotoInput] = useState<number>(1500);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

  // Estado de persistencia
  const [estadoPersistencia, setEstadoPersistencia] = useState<{
    soportado: boolean;
    persistido: boolean;
    mensaje: string;
  }>({ soportado: false, persistido: false, mensaje: "Verificando..." });

  // Estado de restauración
  const [archivoRestaurar, setArchivoRestaurar] = useState<string | null>(null);
  const [previsualizacion, setPrevisualizacion] = useState<{ total: number; nombreEvento: string } | null>(null);
  const [mensajeRestauracion, setMensajeRestauracion] = useState<string | null>(null);
  const [errorRestauracion, setErrorRestauracion] = useState<string | null>(null);
  const [procesandoRestauracion, setProcesandoRestauracion] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const cargarDatos = useCallback(async () => {
    const c = await obtenerConfiguracionEvento();
    setConfig(c);
    setTarifaCarroInput(c.tarifaCarro);
    setTarifaMotoInput(c.tarifaMoto);

    const pers = await solicitarAlmacenamientoPersistente();
    setEstadoPersistencia(pers);
  }, []);

  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => {
      if (activo) cargarDatos();
    });
    return () => {
      activo = false;
    };
  }, [cargarDatos]);

  const handleGuardarTarifas = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevaConf: ConfiguracionParqueadero = {
      ...config,
      tarifaCarro: Number(tarifaCarroInput) || 4000,
      tarifaMoto: Number(tarifaMotoInput) || 1500,
    };
    await guardarConfiguracionEvento(nuevaConf);
    setConfig(nuevaConf);
    setMensajeGuardado("✓ Tarifas fijas actualizadas correctamente.");
    setTimeout(() => setMensajeGuardado(null), 3000);
  };

  const handleExportarCsv = async () => {
    try {
      const csv = await generarCsvMovimientos();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Movimientos_Parqueadero_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      alert("Error al exportar CSV: " + (err instanceof Error ? err.message : "Error"));
    }
  };

  const handleDescargarRespaldo = async () => {
    try {
      const json = await generarRespaldoJson();
      const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Respaldo_ParkingControl_${new Date().toISOString().slice(0, 19).replace(/[:]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      // Refrescar fecha de último respaldo
      await cargarDatos();
    } catch (err) {
      alert("Error al generar respaldo: " + (err instanceof Error ? err.message : "Error"));
    }
  };

  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorRestauracion(null);
    setMensajeRestauracion(null);
    setPrevisualizacion(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = event.target?.result as string;
      try {
        const parsed = JSON.parse(contenido);
        if (!parsed || !Array.isArray(parsed.movimientos)) {
          setErrorRestauracion("El archivo seleccionado no tiene la estructura de respaldo de ParkingControl.");
          return;
        }

        setArchivoRestaurar(contenido);
        setPrevisualizacion({
          total: parsed.movimientos.length,
          nombreEvento: parsed.configuracion?.nombreEvento || "Desconocido",
        });
      } catch {
        setErrorRestauracion("El archivo no es un documento JSON válido.");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmarRestauracion = async () => {
    if (!archivoRestaurar) return;

    const seguro = window.confirm(
      `⚠️ ATENCIÓN: Se van a restaurar ${previsualizacion?.total} registros.\nEsta acción reemplazará la base de datos local actual con los datos del respaldo.\n\n¿Estás seguro de continuar?`
    );
    if (!seguro) return;

    setProcesandoRestauracion(true);
    setErrorRestauracion(null);

    try {
      const res = await restaurarRespaldoJson(archivoRestaurar);
      if (!res.success) {
        setErrorRestauracion(res.error || "Fallo al restaurar respaldo.");
        return;
      }

      setMensajeRestauracion(`✓ Restauración exitosa: ${res.totalRestaurados} movimientos recuperados.`);
      setArchivoRestaurar(null);
      setPrevisualizacion(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await cargarDatos();
    } catch (err) {
      setErrorRestauracion(err instanceof Error ? err.message : "Error inesperado al restaurar");
    } finally {
      setProcesandoRestauracion(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div>
          <h1 className="text-2xl font-black text-white">Configuración y Respaldos</h1>
          <p className="text-xs text-slate-400">Tarifas fijas del evento y seguridad de datos locales</p>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700"
        >
          ← Volver
        </Link>
      </div>

      {/* 1. Tarifas Fijas Configurables */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400">
          1. Tarifas Fijas para el Evento
        </h2>
        <p className="text-xs text-slate-400">
          El valor congelado que se aplicará automáticamente a cada vehículo al momento de ingresar.
        </p>

        <form onSubmit={handleGuardarTarifas} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Tarifa Automóvil ($ COP)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={tarifaCarroInput}
                onChange={(e) => setTarifaCarroInput(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base font-mono font-bold text-emerald-400 focus:border-teal-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Tarifa Motocicleta ($ COP)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={tarifaMotoInput}
                onChange={(e) => setTarifaMotoInput(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base font-mono font-bold text-emerald-400 focus:border-teal-400 focus:outline-none"
              />
            </div>
          </div>

          {mensajeGuardado && (
            <p className="text-xs font-bold text-emerald-300">{mensajeGuardado}</p>
          )}

          <button
            type="submit"
            className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-black uppercase text-white hover:bg-teal-500"
          >
            Guardar Tarifas
          </button>
        </form>
      </div>

      {/* 2. Respaldos y Exportación */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400">
          2. Copias de Seguridad y Exportación
        </h2>
        <p className="text-xs text-slate-400">
          Descarga periódicamente copias de seguridad para garantizar que nunca pierdas información.
        </p>

        {/* Indicador de Última Copia */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs">
          <span className="text-slate-400 font-medium">Última copia de seguridad realizada:</span>
          <p className="font-bold text-white mt-0.5">
            {config.ultimaCopiaSeguridad
              ? new Date(config.ultimaCopiaSeguridad).toLocaleString("es-CO")
              : "⚠️ Aún no has descargado ninguna copia de seguridad en este dispositivo."}
          </p>
          <p className="text-[11px] text-amber-300 mt-1">
            💡 Recomendación: Descarga un respaldo al mediodía y otro al finalizar cada jornada.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleDescargarRespaldo}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-black uppercase text-white shadow-md hover:bg-emerald-500"
          >
            📥 Descargar Respaldo JSON Completo
          </button>

          <button
            type="button"
            onClick={handleExportarCsv}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-3 text-xs font-black uppercase text-slate-200 hover:bg-slate-700"
          >
            📊 Exportar Movimientos a CSV (Excel)
          </button>
        </div>
      </div>

      {/* 3. Restauración Segura de Respaldo */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400">
          3. Restaurar Respaldo desde JSON
        </h2>
        <p className="text-xs text-slate-400">
          Permite recuperar los movimientos en caso de cambiar de dispositivo o formatear el navegador.
        </p>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Seleccionar archivo .json de respaldo:
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleSeleccionarArchivo}
            className="w-full text-xs text-slate-400 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-slate-700"
          />
        </div>

        {errorRestauracion && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs font-bold text-rose-300">
            ❌ {errorRestauracion}
          </div>
        )}

        {mensajeRestauracion && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs font-bold text-emerald-300">
            {mensajeRestauracion}
          </div>
        )}

        {/* Vista Previa de Archivo Válido */}
        {previsualizacion && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-2">
            <p className="text-xs font-bold text-amber-300">
              Vista previa del respaldo:
            </p>
            <ul className="text-xs text-slate-300 list-disc list-inside">
              <li>Total de movimientos a restaurar: <strong>{previsualizacion.total}</strong></li>
              <li>Identificador del evento: <strong>{previsualizacion.nombreEvento}</strong></li>
            </ul>

            <button
              type="button"
              disabled={procesandoRestauracion}
              onClick={handleConfirmarRestauracion}
              className="mt-2 w-full rounded-xl bg-amber-600 py-2.5 text-xs font-black uppercase text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {procesandoRestauracion ? "Restaurando base de datos..." : "Confirmar y Reemplazar Datos"}
            </button>
          </div>
        )}
      </div>

      {/* 4. Estado de Almacenamiento Persistente */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-1">
        <p className="font-bold text-slate-300">
          Estado de Almacenamiento en este Dispositivo:
        </p>
        <p className="text-slate-400">{estadoPersistencia.mensaje}</p>
        <p className="text-[11px] text-slate-500">
          Tecnología: IndexedDB local vía Dexie.js · No requiere internet para funcionar.
        </p>
      </div>
    </div>
  );
}
