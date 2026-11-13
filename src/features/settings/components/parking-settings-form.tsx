"use client";

import { useEffect, useState, useCallback } from "react";
import { getParkingSettings, saveParkingSettings, DEFAULT_PARKING_SETTINGS } from "@/lib/db/local-db";
import type { ParkingSettings } from "@/types/parking";

export function ParkingSettingsForm() {
  const [settings, setSettings] = useState<ParkingSettings>(DEFAULT_PARKING_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getParkingSettings();
      setSettings(data);
    } catch (err) {
      console.error("Error al cargar configuración:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadSettings();
      }
    });
    return () => {
      active = false;
    };
  }, [loadSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveParkingSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm font-medium text-slate-400">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Configuración del Parqueadero</h1>
        <p className="mt-1 text-sm text-slate-400">
          Personalice el nombre del negocio, datos fiscales, cupos máximos y los textos de sus tiquetes PDF.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        {/* Datos Comerciales */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-teal-300">
            1. Datos del Establecimiento
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-300">Nombre del Parqueadero *</label>
              <input
                type="text"
                required
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                placeholder="Ej: ParkingControl Centro"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">NIT o Identificación Tributaria</label>
              <input
                type="text"
                value={settings.nit ?? ""}
                onChange={(e) => setSettings({ ...settings, nit: e.target.value })}
                placeholder="Ej: 900.123.456-7"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Dirección Física</label>
              <input
                type="text"
                value={settings.address ?? ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Ej: Calle 15 # 7-42"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Teléfono / WhatsApp</label>
              <input
                type="tel"
                value={settings.phone ?? ""}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="Ej: 310 123 4567"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Capacidad Nominal */}
        <div className="space-y-4 border-t border-slate-800 pt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-teal-300">
            2. Capacidad y Control de Cupos
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-300">Cupos Máximos Automóviles</label>
              <input
                type="number"
                min="1"
                max="1000"
                required
                value={settings.carCapacity}
                onChange={(e) => setSettings({ ...settings, carCapacity: Number(e.target.value) || 1 })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Límite para alertas preventivas de cupo lleno en automóviles.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Cupos Máximos Motocicletas</label>
              <input
                type="number"
                min="1"
                max="1000"
                required
                value={settings.motorcycleCapacity}
                onChange={(e) => setSettings({ ...settings, motorcycleCapacity: Number(e.target.value) || 1 })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Límite para alertas preventivas de cupo lleno en motocicletas.
              </p>
            </div>
          </div>
        </div>

        {/* Textos de Tiquetes */}
        <div className="space-y-4 border-t border-slate-800 pt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-teal-300">
            3. Mensaje en Tiquetes y Recibos PDF
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-300">Pie de Página del Tiquete</label>
            <textarea
              rows={2}
              value={settings.receiptFooter ?? ""}
              onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
              placeholder="Ej: Gracias por su visita. Conserve este comprobante para retirar su vehículo."
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
            />
          </div>
        </div>

        {savedSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300">
            ✓ Configuración guardada exitosamente. Los próximos tiquetes y recibos PDF reflejarán estos datos.
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="rounded-xl bg-teal-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-teal-500/20 transition hover:bg-teal-400 active:scale-95"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}
