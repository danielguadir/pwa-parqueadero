"use client";

import React, { useState, useEffect, useRef } from "react";
import type { VehicleCategory, LocalParkingSession } from "@/types/parking";
import { validatePlate } from "../domain/plate-validator";
import { registerEntry, isVehicleInside } from "../services/local-entry-service";

interface EntryFormProps {
  onEntrySuccess: (session: LocalParkingSession) => void;
}

export function EntryForm({ onEntrySuccess }: EntryFormProps) {
  const [plate, setPlate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | null>(null);
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

    setIsSubmitting(true);
    try {
      const result = await registerEntry({
        plate: currentValidation.normalizedPlate,
        vehicleCategory: effectiveCategory,
        notes: notes.trim() || undefined,
      });

      if (!result.success || !result.session) {
        setErrorMessage(result.error ?? "No se pudo registrar la entrada.");
      } else {
        // Limpieza y reseteo de formulario
        setPlate("");
        setNotes("");
        setSelectedCategory(null);
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-xl">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>🚗</span> Registrar Entrada de Vehículo
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Captura rápida para el operador. El sistema normaliza placas y opera de forma offline-first.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {/* Campo Placa */}
        <div>
          <label htmlFor="plate-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Placa del Vehículo <span className="text-rose-400">*</span>
          </label>
          <div className="relative mt-2">
            <input
              id="plate-input"
              ref={inputRef}
              type="text"
              autoComplete="off"
              spellCheck="false"
              value={plate}
              onChange={(e) => {
                setPlate(e.target.value.toUpperCase());
                setErrorMessage(null);
                setDuplicateWarning(null);
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
            <p className="mt-1.5 text-xs text-amber-300/90">{validationHint}</p>
          )}
          {duplicateWarning && (
            <p className="mt-1.5 text-xs font-medium text-rose-400 animate-pulse">
              {duplicateWarning}
            </p>
          )}
        </div>

        {/* Selector de Categoría de Vehículo */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Tipo de Vehículo
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("CAR")}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 px-3 text-sm font-semibold transition ${
                effectiveCategory === "CAR"
                  ? "border-teal-500 bg-teal-950/70 text-teal-300 ring-2 ring-teal-500/40"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <span>🚘</span>
              <span>Automóvil</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("MOTORCYCLE")}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 px-3 text-sm font-semibold transition ${
                effectiveCategory === "MOTORCYCLE"
                  ? "border-indigo-500 bg-indigo-950/70 text-indigo-300 ring-2 ring-indigo-500/40"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <span>🏍️</span>
              <span>Motocicleta</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("OTHER")}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 px-3 text-sm font-semibold transition ${
                effectiveCategory === "OTHER"
                  ? "border-amber-500 bg-amber-950/70 text-amber-300 ring-2 ring-amber-500/40"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <span>🚐</span>
              <span>Otro</span>
            </button>
          </div>
        </div>

        {/* Observaciones opcionales */}
        <div>
          <label htmlFor="notes-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Observaciones o Estado del Vehículo <span className="text-slate-500 text-[10px] normal-case">(Opcional)</span>
          </label>
          <input
            id="notes-input"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Casco adicional, rayón previo, etc."
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Error general */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-800/60 bg-rose-950/50 p-3.5 text-sm text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Botón de Envío */}
        <button
          type="submit"
          disabled={isSubmitting || Boolean(duplicateWarning)}
          className="w-full rounded-xl bg-teal-500 py-3.5 px-4 text-base font-bold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          {isSubmitting ? "Registrando entrada..." : "Registrar Entrada e Imprimir Tiquete"}
        </button>
      </form>
    </div>
  );
}
