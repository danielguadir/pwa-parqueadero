"use client";

import { useEffect, useRef, useState, Suspense, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  registrarIngreso,
  verificarPlacaDentro,
  obtenerConfiguracionEvento,
  normalizarPlaca,
  CONFIG_INICIAL,
} from "@/features/parking/services/movimientos-service";
import type { TipoVehiculo, ConfiguracionParqueadero } from "@/types/movimiento";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatearHora, formatearPesos, nombreTipoVehiculo } from "@/lib/utils/formato";

const PLACA_MOTO = /^[A-Z]{3}\d{2}[A-Z]?$/;
const PLACA_CARRO = /^[A-Z]{3}\d{3}$/;

interface Aviso {
  tono: "success" | "error";
  texto: string;
}

function TipoVehiculoSelector({
  valor,
  config,
  onChange,
}: {
  valor: TipoVehiculo;
  config: ConfiguracionParqueadero;
  onChange: (tipo: TipoVehiculo) => void;
}) {
  const opciones: Array<{ tipo: TipoVehiculo; emoji: string; tarifa: number }> = [
    { tipo: "CARRO", emoji: "🚗", tarifa: config.tarifaCarro },
    { tipo: "MOTO", emoji: "🏍️", tarifa: config.tarifaMoto },
  ];

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-ink">Tipo de vehículo</legend>
      <div className="grid grid-cols-2 gap-3">
        {opciones.map(({ tipo, emoji, tarifa }) => {
          const activo = valor === tipo;
          return (
            <button
              key={tipo}
              type="button"
              aria-pressed={activo}
              onClick={() => onChange(tipo)}
              className={cn(
                "flex touch-manipulation flex-col items-center gap-1 rounded-lg border-2 p-4 transition active:scale-[0.98]",
                activo ? "border-primary bg-primary-soft text-primary-strong" : "border-line bg-surface text-ink-muted hover:bg-canvas"
              )}
            >
              <span className="text-3xl" aria-hidden="true">
                {emoji}
              </span>
              <span className="text-sm font-bold uppercase">{nombreTipoVehiculo(tipo)}</span>
              <span className="text-sm font-semibold">{formatearPesos(tarifa)}</span>
              {activo && <span className="text-xs font-semibold">✓ Seleccionado</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function FormularioIngreso() {
  const searchParams = useSearchParams();
  const tipoInicial = searchParams.get("tipo");

  const [config, setConfig] = useState<ConfiguracionParqueadero>(CONFIG_INICIAL);
  const [tipo, setTipo] = useState<TipoVehiculo>(tipoInicial === "MOTO" ? "MOTO" : "CARRO");
  const [tipoManual, setTipoManual] = useState(tipoInicial === "MOTO" || tipoInicial === "CARRO");
  const [placa, setPlaca] = useState("");
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [cedula, setCedula] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [duplicado, setDuplicado] = useState<{ placa: string; hora: string } | null>(null);
  const placaRef = useRef<HTMLInputElement>(null);

  const placaNormalizada = normalizarPlaca(placa);
  const tarifaActual = tipo === "CARRO" ? config.tarifaCarro : config.tarifaMoto;
  const hayDuplicado = duplicado !== null && duplicado.placa === placaNormalizada;

  useEffect(() => {
    obtenerConfiguracionEvento().then(setConfig).catch(() => setConfig(CONFIG_INICIAL));
  }, []);

  // Advertencia en vivo si la placa ya tiene un ingreso activo.
  useEffect(() => {
    if (placaNormalizada.length < 3) return;
    let activo = true;
    verificarPlacaDentro(placaNormalizada).then((existente) => {
      if (!activo) return;
      setDuplicado(existente ? { placa: placaNormalizada, hora: formatearHora(existente.fechaIngreso) } : null);
    });
    return () => {
      activo = false;
    };
  }, [placaNormalizada]);

  const cambiarPlaca = (valor: string) => {
    setPlaca(valor);
    if (tipoManual) return;
    const norm = normalizarPlaca(valor);
    if (PLACA_CARRO.test(norm)) setTipo("CARRO");
    else if (PLACA_MOTO.test(norm)) setTipo("MOTO");
  };

  const elegirTipo = (nuevo: TipoVehiculo) => {
    setTipo(nuevo);
    setTipoManual(true);
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setAviso(null);

    if (!placa.trim()) {
      setAviso({ tono: "error", texto: "Escribe la placa del vehículo." });
      placaRef.current?.focus();
      return;
    }
    if (!nombre.trim()) {
      setAviso({ tono: "error", texto: "Escribe el nombre del propietario o responsable." });
      return;
    }

    setGuardando(true);
    try {
      const res = await registrarIngreso({
        placa: placa.trim(),
        tipoVehiculo: tipo,
        nombre: nombre.trim(),
        celular: celular.trim() || undefined,
        cedula: cedula.trim() || undefined,
      });

      if (!res.success || !res.movimiento) {
        setAviso({ tono: "error", texto: res.error ?? "No se pudo registrar el ingreso." });
        return;
      }

      const m = res.movimiento;
      setAviso({
        tono: "success",
        texto: `Ingreso guardado · Código #${m.codigo}: ${m.placaNormalizada} · ${nombreTipoVehiculo(m.tipoVehiculo)} · ${formatearPesos(m.tarifaAplicada)} · ${formatearHora(m.fechaIngreso)}`,
      });
      setPlaca("");
      setNombre("");
      setCelular("");
      setCedula("");
      setDuplicado(null);
      placaRef.current?.focus();
    } catch (err) {
      setAviso({
        tono: "error",
        texto: `No se pudo guardar en el dispositivo: ${err instanceof Error ? err.message : "error desconocido"}`,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {aviso && (
        <Alert tone={aviso.tono} title={aviso.tono === "success" ? "✓" : "Error:"}>
          {aviso.texto}
        </Alert>
      )}

      <Card title="Ingreso de Vehículo" subtitle="Registro inmediato en el almacenamiento local">
        <form onSubmit={guardar} noValidate className="space-y-4">
          <TipoVehiculoSelector valor={tipo} config={config} onChange={elegirTipo} />

          <Field
            ref={placaRef}
            id="placa"
            label="Placa *"
            icon="placa"
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={placa}
            onChange={(e) => cambiarPlaca(e.target.value)}
            placeholder={tipo === "MOTO" ? "Ej: ABC12D" : "Ej: ABC123"}
            inputClassName="font-mono text-xl font-bold uppercase tracking-widest"
          />

          {hayDuplicado && (
            <Alert tone="warning" title="Atención:">
              La placa {duplicado.placa} ya está dentro desde las {duplicado.hora}.
            </Alert>
          )}

          <Field
            id="nombre"
            label="Nombre del propietario o responsable *"
            icon="usuario"
            autoComplete="off"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre completo"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="celular"
              label="Celular (opcional)"
              icon="telefono"
              type="tel"
              inputMode="tel"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              placeholder="Celular"
            />
            <Field
              id="cedula"
              label="Cédula (opcional)"
              icon="documento"
              inputMode="numeric"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Cédula"
            />
          </div>

          <Alert title="Tarifa fija:">
            {nombreTipoVehiculo(tipo)} · <strong className="text-ink">{formatearPesos(tarifaActual)}</strong> (sin cobro por
            tiempo)
          </Alert>

          <Button type="submit" size="lg" disabled={guardando} className="w-full">
            {guardando ? "Guardando..." : `Guardar Ingreso · ${nombreTipoVehiculo(tipo)} ${formatearPesos(tarifaActual)}`}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function EntradasPage() {
  return (
    <Suspense fallback={null}>
      <FormularioIngreso />
    </Suspense>
  );
}
