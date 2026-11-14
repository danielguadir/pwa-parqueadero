/** Indicador de carga circular azul con texto, como en el diseño de referencia. */
export function Spinner({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-ink-muted" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
      <span>{label}</span>
    </div>
  );
}
