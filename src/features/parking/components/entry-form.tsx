"use client";

import React, { useState, useEffect, useRef } from "react";
import type { VehicleCategory, LocalParkingSession, ParkingZone } from "@/types/parking";
import { PARKING_ZONES } from "@/types/parking";
import { validatePlate } from "../domain/plate-validator";
import { registerEntry, isVehicleInside } from "../services/local-entry-service";

interface EntryFormProps {
  onEntrySuccess: (session: LocalParkingSession) => void;
}

export function EntryForm({ onEntrySuccess }: EntryFormProps) {
  const [plate, setPlate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | null>(null);
  const [selectedZone, setSelectedZone] = useState<ParkingZone>("ZONA_CENTRAL_A");
  const [driverDocument, setDriverDocument] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [customRate, setCustomRate] = useState<string>("4000"); // $4.000 carro por defecto
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-enfoque en el campo de placa al cargar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Estado derivado puro (Directrices de React 19 / sin cascada de efectos)
  const trimmedPlate = plate.trim();
  const validation = trimmedPlate ? validatePlate(trimmedPlate) : null;
  const validationHint = validation && !validation.isValid ? validation.error ?? null : null;
  const effectiveCategory = selectedCategory ?? (validation?.isValid && validation.suggestedType !== "OTHER" ? validation.suggestedType : "CAR");

  // Al cambiar la categoría, actualizar automáticamente la tarifa por defecto ($4.000 carro, $1.500 moto)
  const handleCategoryChange = (category: VehicleCategory) => {
    setSelectedCategory(category);
    if (category === "CAR") setCustomRate("4000");
    else if (category === "MOTORCYCLE") setCustomRate("1500");
    else setCustomRate("6000");
  };

  // Verificación asíncrona de duplicado solo si la placa es válida
  useEffect(() => {
    if (!validation || !validation.isValid) {
      return;
    }

    let isMounted = true;
    isVehicleInside(validation.normalizedPlate).then((inside) => {
      if (isMounted) {
        setDuplicateWarning(
          inside ? `¡Atención! La placa ${validation.normalizedPlate} ya tiene una estancia activa dentro.` : null
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, [validation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const currentValidation = validatePlate(plate);
    if (!currentValidation.isValid) {
      setErrorMessage(currentValidation.error ?? "Placa inválida.");
      return;
    }

    const rateNum = Number(customRate);
    if (isNaN(rateNum) || rateNum < 0) {
      setErrorMessage("La tarifa debe ser un valor numérico válido mayor o igual a 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerEntry({
        plate: currentValidation.normalizedPlate,
        vehicleCategory: effectiveCategory,
        zone: selectedZone,
        driverDocument: driverDocument.trim() || undefined,
        driverPhone: driverPhone.trim() || undefined,
        agreedRate: rateNum,
        notes: notes.trim() || undefined,
      });

      if (!result.success || !result.session) {
        setErrorMessage(result.error ?? "No se pudo registrar la entrada.");
      } else {
        // Limpieza y reseteo de formulario
        setPlate("");
        setDriverDocument("");
        setDriverPhone("");
        setNotes("");
        setSelectedCategory(null);
        setSelectedZone("ZONA_CENTRAL_A");
        setCustomRate("4000");
        setErrorMessage(null);
        setDuplicateWarning(null);
        onEntrySuccess(result.session);
        inputRef.current?.focus();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error inesperado al guardar localmente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-4 sm:p-6 shadow-xl">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>🚗</span> Registrar Entrada de Vehículo
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Tarifa fija automática ($4.000 auto / $1.500 moto), zona de parqueo y datos de contacto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Campo Placa */}
        <div>
          <label htmlFor="plate-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Placa del Vehículo <span className="text-rose-400">*</span>
          </label>
          <div className="relative mt-1.5">
            <input
              id="plate-input"
              ref={inputRef}
              type="text"
              autoComplete="off"
              spellCheck="false"
              value={plate}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setPlate(val);
                setErrorMessage(null);
                setDuplicateWarning(null);
                // Si infiere moto al escribir, ajustar tarifa a $1.500; si es carro, $4.000
                const v = validatePlate(val);
                if (v.isValid && !selectedCategory) {
                  if (v.suggestedType === "MOTORCYCLE") setCustomRate("1500");
                  else if (v.suggestedType === "CAR") setCustomRate("4000");
                }
              }}
              placeholder="Ej. ABC123 o ABC12D"
              maxLength={8}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 font-mono text-2xl font-black uppercase tracking-widest text-teal-300 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-600 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            {plate && (
              <button
                type="button"
                onClick={() => {
                  setPlate("");
                  setErrorMessage(null);
                  setDuplicateWarning(null);
                }}
                className="absolute right-3.5 top-3.5 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>
          {validationHint && (
            <p className="mt-1 text-xs text-amber-300/90">{validationHint}</p>
          )}
          {duplicateWarning && (
            <p className="mt-1 text-xs font-medium text-rose-400 animate-pulse">
              {duplicateWarning}
            </p>
          )}
        </div>

        {/* Selector de Categoría de Vehículo */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Tipo de Vehículo
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleCategoryChange("CAR")}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-xl border py-2.5 px-2 text-xs sm:text-sm font-semibold transition active:scale-95 ${
                effectiveCategory === "CAR"
                  ? "border-teal-500 bg-teal-950/70 text-teal-300 ring-2 ring-teal-500/40"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <span className="text-base sm:text-lg">🚘</span>
              <span>Automóvil</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryChange("MOTORCYCLE")}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-xl border py-2.5 px-2 text-xs sm:text-sm font-semibold transition active:scale-95 ${
                effectiveCategory === "MOTORCYCLE"
                  ? "border-indigo-500 bg-indigo-950/70 text-indigo-300 ring-2 ring-indigo-500/40"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <span className="text-base sm:text-lg">🏍️</span>
              <span>Moto</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryChange("OTHER")}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-xl border py-2.5 px-2 text-xs sm:text-sm font-semibold transition active:scale-95 ${
                effectiveCategory === "OTHER"
                  ? "border-amber-500 bg-amber-950/70 text-amber-300 ring-2 ring-amber-500/40"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <span className="text-base sm:text-lg">🚐</span>
              <span>Otro</span>
            </button>
          </div>
        </div>

        {/* Tarifa Fijada por Defecto (Editable) */}
        <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-3">
          <label htmlFor="rate-input" className="block text-xs font-semibold uppercase tracking-wider text-teal-300">
            💵 Tarifa Asignada ($ COP)
          </label>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400">$</span>
            <input
              id="rate-input"
              type="number"
              min="0"
              step="100"
              inputMode="numeric"
              value={customRate}
              onChange={(e) => setCustomRate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xl font-extrabold text-white focus:border-teal-400 focus:outline-none"
            />
            <span className="text-xs text-slate-400">COP</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Cobro fijo predeterminado: $4.000 para automóvil y $1.500 para moto (modificable si es necesario).
          </p>
        </div>

        {/* Datos del Conductor: Cédula y Celular (Solicitado por el usuario) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="document-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              🪪 Cédula / Documento <span className="text-slate-500 text-[10px] normal-case">(Opcional)</span>
            </label>
            <input
              id="document-input"
              type="text"
              inputMode="numeric"
              value={driverDocument}
              onChange={(e) => setDriverDocument(e.target.value)}
              placeholder="Ej. 1085234987"
              maxLength={15}
              disabled={isSubmitting}
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="phone-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              📱 Celular / Teléfono <span className="text-slate-500 text-[10px] normal-case">(Opcional)</span>
            </label>
            <input
              id="phone-input"
              type="tel"
              inputMode="tel"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              placeholder="Ej. 3124567890"
              maxLength={15}
              disabled={isSubmitting}
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Selector de Zona de Parqueo */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            📍 Zona de Parqueo Asignada
          </label>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {PARKING_ZONES.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZone(zone.id)}
                className={`rounded-xl border py-2 px-2 text-center text-xs font-medium transition active:scale-95 ${
                  selectedZone === zone.id
                    ? "border-teal-400 bg-teal-900/50 text-white font-bold ring-1 ring-teal-400"
                    : "border-slate-800 bg-slate-950/80 text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                {zone.short}
              </button>
            ))}
          </div>
        </div>

        {/* Observaciones opcionales */}
        <div>
          <label htmlFor="notes-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Observaciones <span className="text-slate-500 text-[10px] normal-case">(Opcional)</span>
          </label>
          <input
            id="notes-input"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Casco adicional, rayón previo, etc."
            disabled={isSubmitting}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* Error general */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-800/60 bg-rose-950/50 p-3 text-xs sm:text-sm text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Botón de Envío */}
        <button
          type="submit"
          disabled={isSubmitting || Boolean(duplicateWarning)}
          className="w-full rounded-xl bg-teal-500 py-3.5 px-4 text-sm sm:text-base font-bold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:bg-teal-400 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          {isSubmitting ? "Registrando entrada..." : `✓ Registrar Entrada ($${Number(customRate || 0).toLocaleString("es-CO")} COP)`}
        </button>
      </form>
    </div>
  );
}
