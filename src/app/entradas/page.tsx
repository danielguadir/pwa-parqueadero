"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  registrarIngreso,
  verificarPlacaDentro,
  obtenerConfiguracionEvento,
  normalizarPlaca,
} from "@/features/parking/services/movimientos-service";
import type { TipoVehiculo, ConfiguracionParqueadero, MovimientoParqueadero } from "@/types/movimiento";

export default function EntradasPage() {
  const [placa, setPlaca] = useState("");
  const [tipo, setTipo] = useState<TipoVehiculo>("CARRO");
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

  // Auto-detección amigable: si la placa termina en letra y tiene 5 o 6 caracteres (ej. XYZ12D), sugerir moto
  const handlePlacaChange = (val: string) => {
    setPlaca(val);
    const norm = normalizarPlaca(val);
    if (/^[A-Z]{3}\d{2}[A-Z]$/.test(norm) || /^[A-Z]{3}\d{2}$/.test(norm)) {
      setTipo("MOTO");
    } else if (/^[A-Z]{3}\d{3}$/.test(norm)) {
      setTipo("CARRO");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;

    setErrorGuardado(null);
    setMensajeExito(null);

    if (!placa.trim()) {
      setErrorGuardado("La placa es obligatoria.");
      placaInputRef.current?.focus();
      return;
    }
    if (!nombre.trim()) {
      setErrorGuardado("El nombre del propietario o responsable es obligatorio.");
      return;
    }

    setGuardando(true);

    try {
      const res = await registrarIngreso({
        placa,
        tipoVehiculo: tipo,
        nombre,
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
      setMensajeExito(`✓ Ingreso guardado correctamente: Placa ${res.movimiento.placaNormalizada} (${res.movimiento.tipoVehiculo}) - Tarifa: $${res.movimiento.tarifaAplicada.toLocaleString("es-CO")}`);

      // Limpiar formulario y reenfocar placa para el siguiente ingreso
      setPlaca("");
      setNombre("");
      setCelular("");
      setCedula("");
      setAdvertenciaDuplicado(null);
      placaInputRef.current?.focus();
    } catch (err) {
      console.error("Error al registrar en IndexedDB:", err);
      setErrorGuardado(`Fallo crítico al guardar en base de datos local: ${err instanceof Error ? err.message : "Error desconocido"}`);
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
          <p className="text-xs text-slate-400">Registro rápido para entrada al parqueadero</p>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700"
        >
          ← Volver
        </Link>
      </div>

      {/* Banner de Éxito Confirmado */}
      {mensajeExito && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-sm font-bold text-emerald-300 shadow-md">
          <p>{mensajeExito}</p>
          {ultimoRegistrado && (
            <p className="mt-1 text-xs font-normal text-emerald-200">
              Registrado a nombre de: {ultimoRegistrado.nombre} a las {new Date(ultimoRegistrado.fechaIngreso).toLocaleTimeString("es-CO")}
            </p>
          )}
        </div>
      )}

      {/* Banner de Error */}
      {errorGuardado && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm font-bold text-rose-300">
          ❌ {errorGuardado}
        </div>
      )}

      {/* Advertencia de Placa Duplicada */}
      {advertenciaDuplicado && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/40 p-3 text-xs font-bold text-amber-300">
          {advertenciaDuplicado}
        </div>
      )}

      {/* Formulario Principal */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
        {/* Selector de Tipo (Carro / Moto) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Tipo de Vehículo *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipo("CARRO")}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-black transition ${
                tipo === "CARRO"
                  ? "border-teal-400 bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <span className="text-xl">🚗</span>
              AUTOMÓVIL (${config.tarifaCarro.toLocaleString("es-CO")})
            </button>

            <button
              type="button"
              onClick={() => setTipo("MOTO")}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-black transition ${
                tipo === "MOTO"
                  ? "border-teal-400 bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <span className="text-xl">🏍️</span>
              MOTOCICLETA (${config.tarifaMoto.toLocaleString("es-CO")})
            </button>
          </div>
        </div>

        {/* Placa */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Placa del Vehículo *
          </label>
          <input
            ref={placaInputRef}
            type="text"
            required
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck="false"
            value={placa}
            onChange={(e) => handlePlacaChange(e.target.value)}
            placeholder="Ej: ABC123"
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-2xl font-black uppercase tracking-widest text-teal-300 placeholder-slate-600 focus:border-teal-400 focus:outline-none"
          />
        </div>

        {/* Nombre Responsable */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Nombre del Propietario / Responsable *
          </label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Juan Pérez"
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-base font-semibold text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none"
          />
        </div>

        {/* Celular y Cédula (Opcionales) */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Celular (Opcional)
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              placeholder="Ej: 310 123 4567"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Cédula (Opcional)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ej: 1085234567"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Resumen de Tarifa Fija y Estado */}
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
          <span className="text-slate-400 font-medium">Tarifa fija a registrar:</span>
          <span className="font-mono text-base font-black text-emerald-400">
            ${tarifaActual.toLocaleString("es-CO")} COP
          </span>
        </div>

        {/* Botón de Guardar con Anti-Doble Pulsación */}
        <button
          type="submit"
          disabled={guardando}
          className="w-full rounded-xl bg-emerald-600 py-3.5 text-base font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {guardando ? "Guardando en dispositivo..." : "Guardar Ingreso"}
        </button>
      </form>
    </div>
  );
}
