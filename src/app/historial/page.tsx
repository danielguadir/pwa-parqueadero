"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  obtenerHistorial,
  marcarPagoPendiente,
  sincronizarConServidor,
} from "@/features/parking/services/movimientos-service";
import type { MovimientoParqueadero, FiltroHistorial } from "@/types/movimiento";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { PagoBadge, VehiculoBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatearHora, formatearPesos, nombreTipoVehiculo } from "@/lib/utils/formato";

const FILTROS: Array<{ id: FiltroHistorial; label: string }> = [
  { id: "TODOS", label: "Todos" },
  { id: "DENTRO", label: "Dentro" },
  { id: "RETIRADOS", label: "Retirados" },
  { id: "PAGADOS", label: "Pagados" },
  { id: "PENDIENTES", label: "Pendientes" },
];

export default function HistorialPage() {
  const [filtro, setFiltro] = useState<FiltroHistorial>("TODOS");
  const [movimientos, setMovimientos] = useState<MovimientoParqueadero[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargarDatos = useCallback(async (f: FiltroHistorial) => {
    setCargando(true);
    try {
      const data = await obtenerHistorial(f);
      setMovimientos(data);

      // Sincronizar en segundo plano para traer registros del celular o PC
      sincronizarConServidor()
        .then((res) => {
          if (res.success) {
            obtenerHistorial(f).then(setMovimientos);
          }
        })
        .catch(() => {});
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => {
      if (activo) cargarDatos(filtro);
    });
    return () => {
      activo = false;
    };
  }, [filtro, cargarDatos]);

  // Total efectivamente recaudado: SUMA ESTRICTAMENTE REGISTROS PAGADOS
  const totalRecaudado = movimientos.reduce((acc, m) => {
    return m.estadoPago === "PAGADO" ? acc + m.tarifaAplicada : acc;
  }, 0);

  const handleMarcarPagado = async (m: MovimientoParqueadero) => {
    setActualizandoId(m.id);
    try {
      await marcarPagoPendiente(m.id);
      setMensaje(`✓ Pago de ${m.placaNormalizada} actualizado a PAGADO.`);
      await cargarDatos(filtro);
      setTimeout(() => setMensaje(null), 3000);
    } catch (err) {
      alert("Error al actualizar pago: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setActualizandoId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {mensaje && (
        <Alert tone="success" title="✓">
          {mensaje}
        </Alert>
      )}

      {/* Tarjeta de resumen financiero */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <StatCard
            label="Total efectivamente recaudado"
            value={formatearPesos(totalRecaudado)}
            hint="Suma únicamente registros con estado PAGADO (los pendientes no se suman)"
            highlight
          />
        </div>
        <div>
          <StatCard
            label="Registros en pantalla"
            value={movimientos.length}
            hint={`Filtro actual: ${FILTROS.find((f) => f.id === filtro)?.label}`}
          />
        </div>
      </div>

      {/* Filtros de estado */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => {
          const activo = filtro === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-xs font-semibold transition touch-manipulation",
                activo
                  ? "bg-primary text-white shadow-sm"
                  : "border border-line bg-surface text-ink-muted hover:bg-canvas hover:text-ink"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <Card>
        {cargando ? (
          <Spinner label="Cargando historial..." />
        ) : movimientos.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-muted">
            No hay vehículos que coincidan con el filtro seleccionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-canvas/60 text-xs font-semibold uppercase text-ink-muted">
                <tr>
                  <th className="px-3 py-3">Código</th>
                  <th className="px-3 py-3">Placa</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3">Propietario</th>
                  <th className="px-3 py-3">Ingreso</th>
                  <th className="px-3 py-3">Salida</th>
                  <th className="px-3 py-3 text-right">Tarifa</th>
                  <th className="px-3 py-3 text-center">Vehículo</th>
                  <th className="px-3 py-3 text-center">Pago</th>
                  <th className="px-3 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {movimientos.map((m) => {
                  const esPagado = m.estadoPago === "PAGADO";
                  return (
                    <tr key={m.id} className="hover:bg-canvas/40 transition">
                      <td className="px-3 py-3 font-mono text-xs font-semibold text-primary whitespace-nowrap">
                        #{m.codigo || "—"}
                      </td>
                      <td className="px-3 py-3 font-mono font-bold tracking-wider text-ink whitespace-nowrap">
                        {m.placaNormalizada}
                      </td>
                      <td className="px-3 py-3 text-ink-muted whitespace-nowrap">
                        {nombreTipoVehiculo(m.tipoVehiculo)}
                      </td>
                      <td className="px-3 py-3 text-ink">
                        <div className="font-medium">{m.nombre}</div>
                        {(m.celular || m.cedula) && (
                          <div className="text-xs text-ink-muted">
                            {m.cedula ? `CC: ${m.cedula} ` : ""}
                            {m.celular ? `Tel: ${m.celular}` : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-ink-muted whitespace-nowrap">
                        {formatearHora(m.fechaIngreso)}
                      </td>
                      <td className="px-3 py-3 text-xs text-ink-muted whitespace-nowrap">
                        {m.fechaSalida ? formatearHora(m.fechaSalida) : "—"}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-ink whitespace-nowrap">
                        {formatearPesos(m.tarifaAplicada)}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <VehiculoBadge estado={m.estadoVehiculo} />
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <PagoBadge estado={m.estadoPago} />
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {!esPagado ? (
                          <Button
                            variant="secondary"
                            size="md"
                            disabled={actualizandoId === m.id}
                            onClick={() => handleMarcarPagado(m)}
                            className="px-2.5 py-1 text-xs"
                          >
                            {actualizandoId === m.id ? "..." : "Marcar Pagado"}
                          </Button>
                        ) : (
                          <span className="text-xs text-ink-soft">Al día</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
        <span>Mostrando {movimientos.length} registros en total.</span>
        <Link href="/configuracion" className={buttonClasses("secondary", "md", "text-xs py-1.5")}>
          Exportar a CSV o Descargar Respaldo JSON →
        </Link>
      </div>
    </div>
  );
}
