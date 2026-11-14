import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { EstadoPago, EstadoVehiculo } from "@/types/movimiento";

export type BadgeTone = "info" | "success" | "warning" | "neutral";

const TONOS: Record<BadgeTone, string> = {
  info: "bg-primary-soft text-primary-strong",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  neutral: "bg-canvas text-ink-muted",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold", TONOS[tone])}>
      {children}
    </span>
  );
}

/** Estado del pago: siempre identificado con texto, no solo color. */
export function PagoBadge({ estado }: { estado: EstadoPago }) {
  return estado === "PAGADO" ? <Badge tone="success">PAGADO</Badge> : <Badge tone="warning">PENDIENTE</Badge>;
}

export function VehiculoBadge({ estado }: { estado: EstadoVehiculo }) {
  return estado === "DENTRO" ? <Badge tone="info">DENTRO</Badge> : <Badge tone="neutral">RETIRADO</Badge>;
}
