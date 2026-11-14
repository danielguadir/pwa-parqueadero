"use client";

import { useState, useEffect, useCallback } from "react";
import {
  buscarParaRetiro,
  registrarRetiro,
  marcarPagoPendiente,
} from "@/features/parking/services/movimientos-service";
import type { MovimientoParqueadero, EstadoPago } from "@/types/movimiento";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PagoBadge, VehiculoBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatearFechaHora, formatearPesos, nombreTipoVehiculo } from "@/lib/utils/formato";

export default function SalidasPage() {
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState<MovimientoParqueadero[]>([]);
  const [seleccionado, setSeleccionado] = useState<MovimientoParqueadero | null>(null);

  const [procesando, setProcesando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorRetiro, setErrorRetiro] = useState<string | null>(null);

  const ejecutarBusqueda = useCallback(async (query: string) => {
    try {
      const res = await buscarParaRetiro(query);
      setResultados(res);
      setSeleccionado((prev) => {
        if (!prev) return null;
        return res.find((r) => r.id === prev.id) || null;
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
        return;
      }

      setMensajeExito(
        `Retiro completado: Placa ${res.movimiento.placaNormalizada} · Estado de pago: [${res.movimiento.estadoPago}]`
      );
      setSeleccionado(null);
      await ejecutarBusqueda(termino);
    } catch (err) {
      setErrorRetiro(err instanceof Error ? err.message : "Error al guardar retiro en el dispositivo");
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
        return;
      }

      setMensajeExito(`Pago registrado para placa ${res.movimiento.placaNormalizada}. Salida histórica conservada.`);
      setSeleccionado(null);
      await ejecutarBusqueda(termino);
    } catch (err) {
      setErrorRetiro(err instanceof Error ? err.message : "Error al actualizar pago en el dispositivo");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      {mensajeExito && (
        <Alert tone="success" title="✓">
          {mensajeExito}
        </Alert>
      )}

      {errorRetiro && (
        <Alert tone="error" title="Error:">
          {errorRetiro}
        </Alert>
      )}

      {/* Buscador */}
      <Card
        title="Retiro de Vehículo"
        subtitle="Busca por placa, nombre o cédula para cobrar y dar salida al vehículo"
      >
        <div className="relative">
          <Field
            id="buscar-vehiculo"
            label="Búsqueda rápida"
            icon="buscar"
            autoFocus
            autoComplete="off"
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            placeholder="Escribe la placa (ej: ABC123), nombre o cédula..."
            inputClassName="pr-20 text-base"
          />
          {termino && (
            <button
              type="button"
              onClick={() => setTermino("")}
              className="absolute right-3 top-9 text-xs font-semibold text-ink-muted hover:text-ink"
            >
              Limpiar
            </button>
          )}
        </div>
      </Card>

      {/* Detalle del vehículo seleccionado */}
      {seleccionado && (
        <Card
          className="border-2 border-primary/40 shadow-md"
          title={`Vehículo: ${seleccionado.placaNormalizada}`}
          subtitle={`${nombreTipoVehiculo(seleccionado.tipoVehiculo)} · ${seleccionado.nombre}`}
          actions={
            <Button variant="secondary" size="md" onClick={() => setSeleccionado(null)}>
              Cerrar
            </Button>
          }
        >
          <div className="grid gap-3 rounded-lg bg-canvas p-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-xs text-ink-muted">Responsable:</span>
              <p className="font-semibold text-ink">{seleccionado.nombre}</p>
              {seleccionado.cedula && <p className="text-xs text-ink-muted">CC: {seleccionado.cedula}</p>}
              {seleccionado.celular && <p className="text-xs text-ink-muted">Tel: {seleccionado.celular}</p>}
            </div>

            <div>
              <span className="text-xs text-ink-muted">Ingreso:</span>
              <p className="font-semibold text-ink">{formatearFechaHora(seleccionado.fechaIngreso)}</p>
              <p className="mt-1 text-xs text-ink-muted">
                Tarifa fija: <strong className="text-ink">{formatearPesos(seleccionado.tarifaAplicada)}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">Estado vehículo:</span>
              <VehiculoBadge estado={seleccionado.estadoVehiculo} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">Estado pago:</span>
              <PagoBadge estado={seleccionado.estadoPago} />
            </div>
          </div>

          <div className="mt-4">
            {seleccionado.estadoVehiculo === "DENTRO" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="success"
                  size="lg"
                  disabled={procesando}
                  onClick={() => handleRetiro("PAGADO")}
                  className="w-full"
                >
                  {procesando ? "Guardando..." : "1. Retirar — PAGADO"}
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  disabled={procesando}
                  onClick={() => handleRetiro("PENDIENTE")}
                  className="w-full"
                >
                  {procesando ? "Guardando..." : "2. Retirar — PAGO PENDIENTE"}
                </Button>
              </div>
            ) : seleccionado.estadoPago === "PENDIENTE" ? (
              <div className="space-y-3 rounded-lg border border-warning/40 bg-warning-soft p-4 text-center">
                <p className="text-sm font-medium text-warning">
                  Este vehículo ya fue retirado, pero aún tiene el pago PENDIENTE.
                </p>
                <Button
                  variant="success"
                  size="lg"
                  disabled={procesando}
                  onClick={() => handleMarcarPagado(seleccionado)}
                  className="w-full sm:w-auto"
                >
                  {procesando ? "Guardando..." : "Marcar como PAGADO ahora"}
                </Button>
              </div>
            ) : (
              <Alert tone="info">Este vehículo ya fue retirado y pagado previamente. No requiere acciones.</Alert>
            )}
          </div>
        </Card>
      )}

      {/* Resultados */}
      <Card
        title={`Resultados (${resultados.length})`}
        subtitle="Selecciona un vehículo para retirarlo o marcar su pago"
      >
        {resultados.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            No se encontraron vehículos que coincidan con la búsqueda.
          </p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {resultados.map((m) => {
              const activo = seleccionado?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSeleccionado(m)}
                  className={cn(
                    "flex flex-col rounded-lg border p-3.5 text-left transition touch-manipulation active:scale-[0.99]",
                    activo
                      ? "border-primary bg-primary-soft/60 shadow-sm ring-2 ring-primary/30"
                      : "border-line bg-surface hover:border-ink-soft hover:bg-canvas"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-bold tracking-wider text-ink">{m.placaNormalizada}</span>
                    <VehiculoBadge estado={m.estadoVehiculo} />
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-ink">{m.nombre}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
                    <span>
                      {nombreTipoVehiculo(m.tipoVehiculo)} · {formatearPesos(m.tarifaAplicada)}
                    </span>
                    <PagoBadge estado={m.estadoPago} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
