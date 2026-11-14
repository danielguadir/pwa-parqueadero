import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type AlertTone = "info" | "success" | "warning" | "error";

const TONOS: Record<AlertTone, string> = {
  info: "border-primary bg-canvas/70 text-ink-muted",
  success: "border-success bg-success-soft text-success",
  warning: "border-warning bg-warning-soft text-warning",
  error: "border-danger bg-danger-soft text-danger",
};

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Mensaje con borde izquierdo de color (estilo "Nota para pruebas"). */
export function Alert({ tone = "info", title, children, className }: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-md border-l-4 px-4 py-3 text-sm", TONOS[tone], className)}
    >
      {title && <strong className="font-semibold text-ink">{title} </strong>}
      {children}
    </div>
  );
}
