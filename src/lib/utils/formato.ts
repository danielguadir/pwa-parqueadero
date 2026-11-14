import type { TipoVehiculo } from "@/types/movimiento";

const LOCALE = "es-CO";

/** Formatea un valor en pesos colombianos sin decimales. Ej: 4000 -> "$4.000". */
export function formatearPesos(valor: number): string {
  return `$${valor.toLocaleString(LOCALE)}`;
}

/** Fecha y hora corta. Ej: "15/11/2026, 10:32 a. m." */
export function formatearFechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Solo la hora. Ej: "10:32 a. m." */
export function formatearHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
}

/** Nombre legible del tipo de vehículo. */
export function nombreTipoVehiculo(tipo: TipoVehiculo): string {
  return tipo === "CARRO" ? "Carro" : "Moto";
}
