"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  registrarIngreso,
  verificarPlacaDentro,
  obtenerConfiguracionEvento,
  normalizarPlaca,
} from "@/features/parking/services/movimientos-service";
import type { TipoVehiculo, ConfiguracionParqueadero, MovimientoParqueadero } from "@/types/movimiento";

function EntradasContent() {
  const searchParams = useSearchParams();
  const tipoParam = searchParams.get("tipo");

  const [placa, setPlaca] = useState("");
  const [tipo, setTipo] = useState<TipoVehiculo>(() => {
    return tipoParam === "MOTO" ? "MOTO" : "CARRO";
  });
  const [tipoManual, setTipoManual] = useState<boolean>(Boolean(tipoParam));
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [cedula, setCedula] = useState("");

  const [guardando, setGuardando] = useState<boolean>(false);
  const [advertenciaDuplicado, setAdvertenciaDuplicado] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [ultimoRegistrado, setUltimoRegistrado] = useState<MovimientoParqueadero | null>(null);

  const [config, setConfig] = useState<ConfiguracionParqueadero>({
    tarifaCarro: 4000,
    tarifaMoto: 1500,
    nombreEvento: "Evento",
    ultimaCopiaSeguridad: null,
  });

  const placaInputRef = useRef<HTMLInputElement>(null);

  const cargarConfiguracion = useCallback(async () => {
    const c = await obtenerConfiguracionEvento();
    setConfig(c);
  }, []);

  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => {
      if (activo) {
        cargarConfiguracion();
        placaInputRef.current?.focus();
      }
    });
    return () => {
      activo = false;
    };
  }, [cargarConfiguracion]);

  // Si viene con parámetro en la URL (ej. ?tipo=MOTO), actualizar tipo
  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => {
      if (!activo) return;
      if (tipoParam === "MOTO") {
        setTipo("MOTO");
        setTipoManual(true);
      } else if (tipoParam === "CARRO") {
        setTipo("CARRO");
        setTipoManual(true);
      }
    });
    return () => {
      activo = false;
    };
  }, [tipoParam]);

  // Verificación en vivo de placa duplicada
  useEffect(() => {
    let activo = true;
    const norm = normalizarPlaca(placa);
    if (norm.length >= 3) {
      verificarPlacaDentro(norm).then((existente) => {
        if (!activo) return;
        setAdvertenciaDuplicado(
          existente
            ? `⚠️ ATENCIÓN: El vehículo ${norm} ya tiene un ingreso activo a las ${new Date(existente.fechaIngreso).toLocaleTimeString("es-CO")}.`
            : null
        );
      });
    } else {
      Promise.resolve().then(() => {
        if (activo) setAdvertenciaDuplicado(null);
      });
    }
    return () => {
      activo = false;
    };
  }, [placa]);

  // Auto-detección amigable SOLO si el usuario NO ha seleccionado manualmente el tipo
  const handlePlacaChange = (val: string) => {
    setPlaca(val);
    if (!tipoManual) {
      const norm = normalizarPlaca(val);
      if (/^[A-Z]{3}\d{2}[A-Z]$/.test(norm) || /^[A-Z]{3}\d{2}$/.test(norm)) {
        setTipo("MOTO");
      } else if (/^[A-Z]{3}\d{3}$/.test(norm)) {
        setTipo("CARRO");
      }
    }
  };

  const seleccionarTipo = (nuevoTipo: TipoVehiculo) => {
    setTipo(nuevoTipo);
    setTipoManual(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;

    setErrorGuardado(null);
    setMensajeExito(null);

    const placaLimpia = placa.trim();
    if (!placaLimpia) {
      setErrorGuardado("⚠️ Por favor escribe la placa del vehículo (obligatoria).");
      placaInputRef.current?.focus();
      return;
    }

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setErrorGuardado("⚠️ Por favor escribe el nombre del propietario o responsable (obligatorio).");
      return;
    }

    setGuardando(true);

    try {
      const res = await registrarIngreso({
        placa: placaLimpia,
        tipoVehiculo: tipo,
        nombre: nombreLimpio,
        celular: celular.trim() || undefined,
        cedula: cedula.trim() || undefined,
      });

      if (!res.success || !res.movimiento) {
        setErrorGuardado(res.error || "No se pudo registrar el ingreso.");
        setGuardando(false);
        return;
      }

      // Confirmación real tras confirmación de IndexedDB
      setUltimoRegistrado(res.movimiento);
      setMensajeExito(
        `✓ Ingreso guardado correctamente: Placa ${res.movimiento.placaNormalizada} (${res.movimiento.tipoVehiculo === "CARRO" ? "AUTOMÓVIL" : "MOTOCICLETA"}) - Tarifa: $${res.movimiento.tarifaAplicada.toLocaleString("es-CO")}`
      );

      // Limpiar formulario y reenfocar placa para el siguiente ingreso
      setPlaca("");
      setNombre("");
      setCelular("");
      setCedula("");
      setAdvertenciaDuplicado(null);
      placaInputRef.current?.focus();
    } catch (err) {
      console.error("Error al registrar en IndexedDB:", err);
      setErrorGuardado(
        `Fallo al guardar en base de datos local: ${err instanceof Error ? err.message : "Error desconocido"}`
      );
    } finally {
      setGuardando(false);
    }
  };

  const tarifaActual = tipo === "CARRO" ? config.tarifaCarro : config.tarifaMoto;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div>
          <h1 className="text-2xl font-black text-white">Ingreso de Vehículo</h1>
          <p className="text-xs text-slate-400">
            Registro inmediato en almacenamiento local (IndexedDB)
          </p>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700"
        >
          ← Volver al Inicio
        </Link>
      </div>

      {/* Banner de Éxito Confirmado */}
      {mensajeExito && (
        <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/60 p-4 text-sm font-bold text-emerald-300 shadow-md">
          <p>{mensajeExito}</p>
          {ultimoRegistrado && (
            <p className="mt-1 text-xs font-normal text-emerald-200">
              Responsable: {ultimoRegistrado.nombre} · Entrada: {new Date(ultimoRegistrado.fechaIngreso).toLocaleTimeString("es-CO")}
            </p>
          )}
        </div>
      )}

      {/* Banner de Error */}
      {errorGuardado && (
        <div className="rounded-2xl border border-rose-500/50 bg-rose-950/60 p-4 text-sm font-bold text-rose-300">
          {errorGuardado}
        </div>
      )}

      {/* Advertencia de Placa Duplicada */}
      {advertenciaDuplicado && (
        <div className="rounded-2xl border border-amber-500/50 bg-amber-950/60 p-3.5 text-xs font-bold text-amber-300">
          {advertenciaDuplicado}
        </div>
      )}

      {/* Formulario Principal */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl"
      >
        {/* Selector de Tipo (Carro / Moto) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-300">
              Paso 1: Tipo de Vehículo *
            </label>
            <span className="text-[11px] text-teal-400 font-semibold">
              Selecciona Moto o Automóvil
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Botón Carro */}
            <button
              type="button"
              id="btn-tipo-carro"
              onClick={() => seleccionarTipo("CARRO")}
              className={`relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-4 text-center transition touch-manipulation active:scale-95 cursor-pointer ${
                tipo === "CARRO"
                  ? "border-emerald-400 bg-emerald-500/20 text-white ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-950/50"
                  : "border-slate-700/80 bg-slate-800/80 text-slate-300 hover:bg-slate-700/70"
              }`}
            >
              <span className="text-3xl">🚗</span>
              <span className="text-sm font-black tracking-wide">AUTOMÓVIL</span>
              <span className="text-xs font-bold text-emerald-400">
                ${config.tarifaCarro.toLocaleString("es-CO")} COP
              </span>
              {tipo === "CARRO" && (
                <span className="inline-block mt-1 rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-slate-950">
                  ✓ SELECCIONADO
                </span>
              )}
            </button>

            {/* Botón Moto */}
            <button
              type="button"
              id="btn-tipo-moto"
              onClick={() => seleccionarTipo("MOTO")}
              className={`relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-4 text-center transition touch-manipulation active:scale-95 cursor-pointer ${
                tipo === "MOTO"
                  ? "border-emerald-400 bg-emerald-500/20 text-white ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-950/50"
                  : "border-slate-700/80 bg-slate-800/80 text-slate-300 hover:bg-slate-700/70"
              }`}
            >
              <span className="text-3xl">🏍️</span>
              <span className="text-sm font-black tracking-wide">MOTOCICLETA</span>
              <span className="text-xs font-bold text-emerald-400">
                ${config.tarifaMoto.toLocaleString("es-CO")} COP
              </span>
              {tipo === "MOTO" && (
                <span className="inline-block mt-1 rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-slate-950">
                  ✓ SELECCIONADO
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Placa */}
        <div>
          <label htmlFor="input-placa" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Placa del Vehículo *
          </label>
          <input
            id="input-placa"
            ref={placaInputRef}
            type="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck="false"
            value={placa}
            onChange={(e) => handlePlacaChange(e.target.value)}
            placeholder={tipo === "MOTO" ? "Ej: XYZ12D o ABC12" : "Ej: ABC123"}
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-2xl font-black uppercase tracking-widest text-teal-300 placeholder-slate-600 focus:border-teal-400 focus:outline-none"
          />
        </div>

        {/* Nombre Responsable */}
        <div>
          <label htmlFor="input-nombre" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Nombre del Propietario / Responsable *
          </label>
          <input
            id="input-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Carlos Gómez"
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base font-semibold text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none"
          />
        </div>

        {/* Celular y Cédula (Opcionales) */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="input-celular" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Celular (Opcional)
            </label>
            <input
              id="input-celular"
              type="tel"
              inputMode="tel"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              placeholder="Ej: 310 123 4567"
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="input-cedula" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Cédula (Opcional)
            </label>
            <input
              id="input-cedula"
              type="text"
              inputMode="numeric"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ej: 1085234567"
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Resumen de Tarifa Fija y Estado */}
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">{tipo === "CARRO" ? "🚗" : "🏍️"}</span>
            <span className="text-slate-300 font-medium">
              Tarifa fija para {tipo === "CARRO" ? "Automóvil" : "Motocicleta"}:
            </span>
          </div>
          <span className="font-mono text-lg font-black text-emerald-400">
            ${tarifaActual.toLocaleString("es-CO")} COP
          </span>
        </div>

        {/* Botón de Guardar con Anti-Doble Pulsación y Texto Dinámico */}
        <button
          type="submit"
          id="btn-guardar-ingreso"
          disabled={guardando}
          className="w-full rounded-2xl bg-emerald-600 py-4 text-base font-black uppercase tracking-wider text-white shadow-xl shadow-emerald-950/50 transition hover:bg-emerald-500 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation cursor-pointer"
        >
          {guardando
            ? "Guardando en dispositivo..."
            : `💾 Registrar Ingreso de ${tipo === "CARRO" ? "Automóvil ($" + config.tarifaCarro.toLocaleString("es-CO") + ")" : "Moto ($" + config.tarifaMoto.toLocaleString("es-CO") + ")"}`}
        </button>
      </form>
    </div>
  );
}

export default function EntradasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Cargando formulario de ingreso...</div>}>
      <EntradasContent />
    </Suspense>
  );
}
