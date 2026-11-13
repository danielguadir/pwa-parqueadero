"use client";

import React, { useState, useEffect } from "react";
import type { TariffConfig } from "@/types/parking";
import { DEFAULT_TARIFF_CONFIG, calculateParkingFee } from "@/features/billing/domain/tariff-calculator";
import { getTariffConfig, saveTariffConfig } from "@/features/billing/services/billing-service";

export default function TarifasPage() {
  const [config, setConfig] = useState<TariffConfig>(DEFAULT_TARIFF_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getTariffConfig().then((loaded) => {
      if (isMounted) {
        setConfig(loaded);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveTariffConfig(config);
      setToastMessage("✓ Configuración de tarifas guardada exitosamente.");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error("Error al guardar tarifas:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Cálculos simulados para previsualización inmediata con marcas deterministas
  const mockCar1Hour = calculateParkingFee(
    "2026-01-01T10:00:00.000Z",
    "2026-01-01T10:50:00.000Z", // 50 minutos
    "CAR",
    config
  );

  const mockCar2Hours = calculateParkingFee(
    "2026-01-01T10:00:00.000Z",
    "2026-01-01T11:35:00.000Z", // 95 minutos (1h 35m)
    "CAR",
    config
  );

  const mockMoto1Hour = calculateParkingFee(
    "2026-01-01T10:00:00.000Z",
    "2026-01-01T10:50:00.000Z", // 50 minutos
    "MOTORCYCLE",
    config
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/20">
            Parte 2 · Configuración
          </span>
          <span className="text-xs text-slate-500">Reglas Financieras</span>
        </div>
        <h1 className="mt-1.5 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          Configuración de Tarifas
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
          Ajusta los valores por hora, minutos de gracia y reglas de fraccionamiento del parqueadero.
        </p>
      </div>

      {toastMessage && (
        <div className="rounded-xl border border-teal-500/40 bg-teal-950/70 p-3.5 text-xs sm:text-sm font-semibold text-teal-200 animate-fadeIn">
          {toastMessage}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-12">
        {/* Formulario de Configuración */}
        <form onSubmit={handleSave} className="md:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/95 p-5 sm:p-6 space-y-5 shadow-xl">
          <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
            Valores Base por Categoría
          </h2>

          {/* Tarifa Automóviles */}
          <div>
            <label htmlFor="car-rate" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              🚘 Tarifa Hora Automóvil ($ COP)
            </label>
            <input
              id="car-rate"
              type="number"
              min="0"
              step="100"
              disabled={loading || isSaving}
              value={config.carHourlyRate}
              onChange={(e) => setConfig({ ...config, carHourlyRate: Number(e.target.value) })}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 font-mono text-lg font-bold text-teal-300 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Tarifa Motocicletas */}
          <div>
            <label htmlFor="moto-rate" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              🏍️ Tarifa Hora Motocicleta ($ COP)
            </label>
            <input
              id="moto-rate"
              type="number"
              min="0"
              step="100"
              disabled={loading || isSaving}
              value={config.motorcycleHourlyRate}
              onChange={(e) => setConfig({ ...config, motorcycleHourlyRate: Number(e.target.value) })}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 font-mono text-lg font-bold text-indigo-300 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Tarifa Otros */}
          <div>
            <label htmlFor="other-rate" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              🚐 Tarifa Hora Vehículos Especiales ($ COP)
            </label>
            <input
              id="other-rate"
              type="number"
              min="0"
              step="100"
              disabled={loading || isSaving}
              value={config.otherHourlyRate}
              onChange={(e) => setConfig({ ...config, otherHourlyRate: Number(e.target.value) })}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 font-mono text-lg font-bold text-amber-300 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2 pt-2">
            Reglas de Tiempo y Cortesía
          </h2>

          {/* Minutos de Gracia */}
          <div>
            <label htmlFor="grace-period" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              ⏱️ Minutos de Gracia / Cortesía
            </label>
            <input
              id="grace-period"
              type="number"
              min="0"
              max="60"
              disabled={loading || isSaving}
              value={config.gracePeriodMinutes}
              onChange={(e) => setConfig({ ...config, gracePeriodMinutes: Number(e.target.value) })}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Si un vehículo ingresa y sale antes de este tiempo, la estancia es gratuita ($0).
            </p>
          </div>

          {/* Fraccionamiento */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.chargeFractionAfterHour}
                onChange={(e) => setConfig({ ...config, chargeFractionAfterHour: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-teal-400"
              />
              <span className="text-xs font-semibold text-slate-300">
                Fraccionar el cobro después de la primera hora
              </span>
            </label>
            {config.chargeFractionAfterHour && (
              <div className="mt-2 pl-6">
                <span className="text-[11px] text-slate-400 block mb-1">Tamaño del bloque de fracción (minutos):</span>
                <select
                  value={config.fractionBlockMinutes}
                  onChange={(e) => setConfig({ ...config, fractionBlockMinutes: Number(e.target.value) })}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
                >
                  <option value={15}>15 minutos (1/4 de hora)</option>
                  <option value={30}>30 minutos (1/2 hora)</option>
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || isSaving}
            className="w-full rounded-xl bg-teal-500 py-3.5 px-4 text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/20 hover:bg-teal-400 active:scale-98 transition disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar Configuración de Tarifas"}
          </button>
        </form>

        {/* Panel de Simulación en Vivo */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400">
              Simulador en Vivo
            </h3>
            <p className="text-xs text-slate-400">
              Así se liquidarán las estancias con los valores configurados:
            </p>

            {/* Caso 1: Carro 50 min */}
            <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Caso: Carro 50 min</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-300">Menos de 1 hora:</span>
                <span className="text-sm font-bold text-teal-300">${mockCar1Hour.amountDue.toLocaleString("es-CO")} COP</span>
              </div>
              <p className="text-[10px] text-slate-500 italic">{mockCar1Hour.breakdown}</p>
            </div>

            {/* Caso 2: Carro 1h 35m */}
            <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Caso: Carro 95 min (1h 35m)</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-300">Hora + fracciones:</span>
                <span className="text-sm font-bold text-teal-300">${mockCar2Hours.amountDue.toLocaleString("es-CO")} COP</span>
              </div>
              <p className="text-[10px] text-slate-500 italic">{mockCar2Hours.breakdown}</p>
            </div>

            {/* Caso 3: Moto 50 min */}
            <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Caso: Moto 50 min</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-300">1 hora de moto:</span>
                <span className="text-sm font-bold text-indigo-300">${mockMoto1Hour.amountDue.toLocaleString("es-CO")} COP</span>
              </div>
              <p className="text-[10px] text-slate-500 italic">{mockMoto1Hour.breakdown}</p>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Los cambios aplican inmediatamente para todas las salidas sin reiniciar la app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
