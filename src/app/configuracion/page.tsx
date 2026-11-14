"use client";

import { useState, useEffect, useCallback, useRef, type FormEvent, type ChangeEvent } from "react";
import {
  obtenerConfiguracionEvento,
  guardarConfiguracionEvento,
  generarCsvMovimientos,
  generarRespaldoJson,
  restaurarRespaldoJson,
  depurarDatosPrueba,
  CONFIG_INICIAL,
} from "@/features/parking/services/movimientos-service";
import { solicitarAlmacenamientoPersistente } from "@/lib/db/storage-persistence";
import type { ConfiguracionParqueadero } from "@/types/movimiento";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatearFechaHora } from "@/lib/utils/formato";

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfiguracionParqueadero>(CONFIG_INICIAL);
  const [tarifaCarroInput, setTarifaCarroInput] = useState<number>(4000);
  const [tarifaMotoInput, setTarifaMotoInput] = useState<number>(1500);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

  // Estado de persistencia
  const [estadoPersistencia, setEstadoPersistencia] = useState<{
    soportado: boolean;
    persistido: boolean;
    mensaje: string;
  }>({ soportado: false, persistido: false, mensaje: "Verificando..." });

  // Estado de restauración
  const [archivoRestaurar, setArchivoRestaurar] = useState<string | null>(null);
  const [previsualizacion, setPrevisualizacion] = useState<{ total: number; nombreEvento: string } | null>(null);
  const [mensajeRestauracion, setMensajeRestauracion] = useState<string | null>(null);
  const [errorRestauracion, setErrorRestauracion] = useState<string | null>(null);
  const [procesandoRestauracion, setProcesandoRestauracion] = useState(false);
  const [mensajeDepuracion, setMensajeDepuracion] = useState<string | null>(null);
  const [depurando, setDepurando] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const cargarDatos = useCallback(async () => {
    const c = await obtenerConfiguracionEvento();
    setConfig(c);
    setTarifaCarroInput(c.tarifaCarro);
    setTarifaMotoInput(c.tarifaMoto);

    const pers = await solicitarAlmacenamientoPersistente();
    setEstadoPersistencia(pers);
  }, []);

  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => {
      if (activo) cargarDatos();
    });
    return () => {
      activo = false;
    };
  }, [cargarDatos]);

  const handleGuardarTarifas = async (e: FormEvent) => {
    e.preventDefault();
    const nuevaConf: ConfiguracionParqueadero = {
      ...config,
      tarifaCarro: Number(tarifaCarroInput) || 4000,
      tarifaMoto: Number(tarifaMotoInput) || 1500,
    };
    await guardarConfiguracionEvento(nuevaConf);
    setConfig(nuevaConf);
    setMensajeGuardado("✓ Tarifas fijas actualizadas correctamente.");
    setTimeout(() => setMensajeGuardado(null), 3000);
  };

  const handleExportarCsv = async () => {
    try {
      const csv = await generarCsvMovimientos();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Movimientos_Parqueadero_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      alert("Error al exportar CSV: " + (err instanceof Error ? err.message : "Error"));
    }
  };

  const handleDescargarRespaldo = async () => {
    try {
      const json = await generarRespaldoJson();
      const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Respaldo_ParkingControl_${new Date().toISOString().slice(0, 19).replace(/[:]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      await cargarDatos();
    } catch (err) {
      alert("Error al generar respaldo: " + (err instanceof Error ? err.message : "Error"));
    }
  };

  const handleSeleccionarArchivo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorRestauracion(null);
    setMensajeRestauracion(null);
    setPrevisualizacion(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = event.target?.result as string;
      try {
        const parsed = JSON.parse(contenido);
        if (!parsed || !Array.isArray(parsed.movimientos)) {
          setErrorRestauracion("El archivo seleccionado no tiene la estructura de respaldo de ParkingControl.");
          return;
        }

        setArchivoRestaurar(contenido);
        setPrevisualizacion({
          total: parsed.movimientos.length,
          nombreEvento: parsed.configuracion?.nombreEvento || "Evento",
        });
      } catch {
        setErrorRestauracion("El archivo no es un documento JSON válido.");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmarRestauracion = async () => {
    if (!archivoRestaurar) return;

    const seguro = window.confirm(
      `⚠️ ATENCIÓN: Se van a restaurar ${previsualizacion?.total} registros.\nEsta acción reemplazará la base de datos local actual con los datos del respaldo.\n\n¿Estás seguro de continuar?`
    );
    if (!seguro) return;

    setProcesandoRestauracion(true);
    setErrorRestauracion(null);

    try {
      const res = await restaurarRespaldoJson(archivoRestaurar);
      if (!res.success) {
        setErrorRestauracion(res.error || "Fallo al restaurar respaldo.");
        return;
      }

      setMensajeRestauracion(`✓ Restauración exitosa: ${res.totalRestaurados} movimientos recuperados.`);
      setArchivoRestaurar(null);
      setPrevisualizacion(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await cargarDatos();
    } catch (err) {
      setErrorRestauracion(err instanceof Error ? err.message : "Error inesperado al restaurar");
    } finally {
      setProcesandoRestauracion(false);
    }
  };

  const handleDepurarPruebas = async () => {
    const seguro = window.confirm(
      "⚠️ ¿Deseas depurar y borrar todos los registros de prueba?\n\nEsta acción vaciará el historial de vehículos y reiniciará el parqueadero a CERO para comenzar el evento oficial limpio.\n\n¿Estás seguro de continuar?"
    );
    if (!seguro) return;

    setDepurando(true);
    setMensajeDepuracion(null);
    try {
      const res = await depurarDatosPrueba();
      if (res.success) {
        setMensajeDepuracion("✓ Se han depurado y eliminado todos los datos de prueba. El parqueadero está limpio y en ceros.");
        await cargarDatos();
      } else {
        alert("Error al depurar: " + res.error);
      }
    } finally {
      setDepurando(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-5">
      {/* 1. Tarifas Fijas */}
      <Card
        title="1. Tarifas Fijas para el Evento"
        subtitle="Tarifa fija congelada que se aplicará automáticamente a cada vehículo al momento de ingresar (sin cobro por tiempo)"
      >
        <form onSubmit={handleGuardarTarifas} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="tarifa-carro"
              label="Tarifa fija para Carro ($ COP) *"
              type="number"
              min="0"
              step="100"
              required
              value={tarifaCarroInput}
              onChange={(e) => setTarifaCarroInput(Number(e.target.value))}
            />
            <Field
              id="tarifa-moto"
              label="Tarifa fija para Moto ($ COP) *"
              type="number"
              min="0"
              step="100"
              required
              value={tarifaMotoInput}
              onChange={(e) => setTarifaMotoInput(Number(e.target.value))}
            />
          </div>

          {mensajeGuardado && <Alert tone="success">{mensajeGuardado}</Alert>}

          <Button type="submit" variant="primary">
            Guardar Tarifas
          </Button>
        </form>
      </Card>

      {/* 2. Respaldos y Exportación */}
      <Card
        title="2. Copias de Seguridad y Exportación"
        subtitle="Descarga copias periódicas para tener los registros protegidos fuera de este navegador"
      >
        <div className="space-y-4">
          <Alert tone={config.ultimaCopiaSeguridad ? "info" : "warning"} title="Última copia de seguridad:">
            {config.ultimaCopiaSeguridad
              ? formatearFechaHora(config.ultimaCopiaSeguridad)
              : "Aún no has descargado ninguna copia en este dispositivo. Recomendado: descargar al mediodía y al cierre del día."}
          </Alert>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="primary" size="lg" onClick={handleDescargarRespaldo} className="w-full">
              <Icon name="descargar" className="h-5 w-5" />
              Descargar Respaldo JSON
            </Button>
            <Button variant="secondary" size="lg" onClick={handleExportarCsv} className="w-full">
              <Icon name="descargar" className="h-5 w-5" />
              Exportar a CSV (Excel)
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Restauración */}
      <Card
        title="3. Restaurar Respaldo desde JSON"
        subtitle="Recupera la información si cambias de celular o si formateas el navegador"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="input-archivo-respaldo" className="mb-1.5 block text-sm font-medium text-ink">
              Seleccionar archivo .json de respaldo:
            </label>
            <input
              id="input-archivo-respaldo"
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleSeleccionarArchivo}
              className="w-full rounded-md border border-line bg-field px-3 py-2 text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink hover:file:bg-canvas"
            />
          </div>

          {errorRestauracion && (
            <Alert tone="error" title="Error:">
              {errorRestauracion}
            </Alert>
          )}

          {mensajeRestauracion && (
            <Alert tone="success" title="✓">
              {mensajeRestauracion}
            </Alert>
          )}

          {previsualizacion && (
            <div className="space-y-3 rounded-lg border border-warning/40 bg-warning-soft p-4">
              <strong className="text-sm font-semibold text-warning">Vista previa del archivo:</strong>
              <ul className="list-inside list-disc text-sm text-ink">
                <li>Movimientos a restaurar: <strong>{previsualizacion.total}</strong></li>
                <li>Evento: <strong>{previsualizacion.nombreEvento}</strong></li>
              </ul>
              <Button
                variant="danger"
                size="md"
                disabled={procesandoRestauracion}
                onClick={handleConfirmarRestauracion}
                className="w-full sm:w-auto"
              >
                {procesandoRestauracion ? "Restaurando..." : "Confirmar y Reemplazar Datos"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 4. Depuración de Datos de Prueba */}
      <Card
        title="4. Depurar / Limpiar Datos de Prueba"
        subtitle="Vacía todo el historial de vehículos y resetea el parqueadero a cero para comenzar el evento oficial limpio"
        className="border-danger/30"
      >
        <div className="space-y-3">
          <Alert tone="warning" title="Atención:">
            Usa esta opción antes de iniciar el evento real para borrar los vehículos de prueba que hayas registrado en tu celular o computador.
          </Alert>

          {mensajeDepuracion && <Alert tone="success">{mensajeDepuracion}</Alert>}

          <Button
            variant="danger"
            size="lg"
            disabled={depurando}
            onClick={handleDepurarPruebas}
            className="w-full sm:w-auto"
          >
            {depurando ? "Depurando registros..." : "🗑️ Depurar / Borrar Datos de Prueba (Reiniciar a Cero)"}
          </Button>
        </div>
      </Card>

      {/* 5. Persistencia y Estado */}
      <Alert tone="info" title="Almacenamiento y Sincronización:">
        {estadoPersistencia.mensaje} · Se sincroniza automáticamente con el computador central cuando hay red Wi-Fi.
      </Alert>
    </div>
  );
}
