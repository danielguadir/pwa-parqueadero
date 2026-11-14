"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { obtenerResumenInicio, sincronizarConServidor } from "@/features/parking/services/movimientos-service";
import type { ResumenInicio } from "@/types/movimiento";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import { buttonClasses } from "@/components/ui/button";
import { formatearPesos } from "@/lib/utils/formato";

export function InicioDashboard() {
  const [resumen, setResumen] = useState<ResumenInicio | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    // Cargar datos locales inmediatos
    obtenerResumenInicio()
      .then((data) => activo && setResumen(data))
      .catch((err) => activo && setError(err instanceof Error ? err.message : "No se pudo leer la base local."));

    // Sincronizar con el servidor para traer lo registrado en celular u otros equipos
    sincronizarConServidor()
      .then((res) => {
        if (activo && res.success) {
          obtenerResumenInicio().then((data) => activo && setResumen(data));
        }
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, []);

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card title="ParqueaderoGP" subtitle="Operación del evento · Sincronización automática entre celular y computador">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/entradas" className={buttonClasses("primary", "lg", "py-5 text-lg")}>
            <Icon name="entrada" className="h-6 w-6" />
            Ingresar Vehículo
          </Link>
          <Link href="/salidas" className={buttonClasses("strong", "lg", "py-5 text-lg")}>
            <Icon name="salida" className="h-6 w-6" />
            Retirar Vehículo
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link href="/entradas?tipo=CARRO" className={buttonClasses("secondary", "md")}>
            🚗 Carro
          </Link>
          <Link href="/entradas?tipo=MOTO" className={buttonClasses("secondary", "md")}>
            🏍️ Moto
          </Link>
        </div>
      </Card>

      {error && <Alert tone="error" title="Error:">{error}</Alert>}

      {!resumen && !error ? (
        <Card>
          <Spinner label="Cargando estado local..." />
        </Card>
      ) : (
        resumen && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard label="Vehículos dentro" value={resumen.vehiculosDentro} hint="Actualmente" highlight />
            <StatCard label="Total ingresados" value={resumen.totalIngresados} hint="Todo el evento" />
            <StatCard label="Retirados" value={resumen.vehiculosRetirados} hint="Salidas registradas" />
            <StatCard label="Total recaudado" value={formatearPesos(resumen.totalRecaudado)} hint="Solo pagados" highlight />
            <div className="col-span-2 lg:col-span-1">
              <StatCard label="Pagos pendientes" value={resumen.pagosPendientes} hint="Por cobrar" />
            </div>
          </div>
        )
      )}

      <Alert title="Recomendación:">
        Descarga un respaldo desde{" "}
        <Link href="/configuracion" className="font-semibold text-primary underline">
          Configuración
        </Link>{" "}
        al mediodía y al cierre de cada jornada.
      </Alert>
    </div>
  );
}
