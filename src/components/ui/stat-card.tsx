import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  highlight?: boolean;
}

/** Tarjeta de indicador numérico. */
export function StatCard({ label, value, hint, highlight = false }: StatCardProps) {
  return (
    <div className="rounded-xl border border-line/70 bg-surface p-4 shadow-sm">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold sm:text-3xl", highlight ? "text-primary" : "text-ink")}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}
