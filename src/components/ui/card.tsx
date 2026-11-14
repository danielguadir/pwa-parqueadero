import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps {
  title?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** Tarjeta blanca con sombra suave y encabezado opcional (título, subtítulo y acciones). */
export function Card({ title, subtitle, actions, className, children }: CardProps) {
  return (
    <section className={cn("rounded-xl border border-line/70 bg-surface p-4 shadow-sm sm:p-5", className)}>
      {(title || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-lg font-bold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
