import Link from "next/link";

export function ModulePlaceholder({ name, description }: { name: string; description: string }) {
  return (
    <section className="space-y-6">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-300">Módulo planificado</p>
        <h1 className="text-3xl font-bold text-white">{name}</h1></div>
      <div className="max-w-2xl rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
        <p className="leading-7 text-slate-200">{description}</p>
        <p className="mt-4 rounded-lg bg-amber-900/20 p-3 text-sm text-amber-200">Todavía no hay operaciones reales en este módulo. Es una pantalla base para desarrollar en la fase correspondiente.</p>
      </div>
      <Link className="inline-block rounded-lg border border-teal-400/50 px-4 py-2 text-sm text-teal-200 hover:bg-teal-900/20" href="/dashboard">Volver al panel</Link>
    </section>
  );
}
