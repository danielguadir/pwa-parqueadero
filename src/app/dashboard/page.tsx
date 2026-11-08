import Link from "next/link";

const modules = [
  { title: "Entradas", href: "/entradas", description: "Registro y validación de vehículos" },
  { title: "Salidas", href: "/salidas", description: "Cierre de estancia y cobro" },
  { title: "Historial", href: "/historial", description: "Consultas paginadas por placa y fecha" },
  { title: "Tarifas", href: "/tarifas", description: "Reglas de cobro configurables" },
  { title: "Reportes", href: "/reportes", description: "Movimientos, ocupación y recaudo" },
  { title: "Usuarios", href: "/usuarios", description: "Operadores y autorizaciones" },
];
export default function DashboardPage() {
  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-teal-300">Proyecto en construcción</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Panel de parqueadero</h1>
        <p className="mt-3 max-w-3xl text-slate-400">Esta es la plantilla inicial. La navegación ya está organizada; las operaciones y los datos reales se implementarán por fases.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Vehículos dentro", "Sin conexión a datos"],
          ["Cupos libres", "Pendiente de configuración"],
          ["Movimientos", "Pendiente de implementación"],
        ].map(([title, status]) => (
          <div key={title} className="rounded-2xl border border-slate-700/80 bg-slate-900 p-5">
            <p className="text-sm font-semibold text-slate-100">{title}</p>
            <p className="mt-3 text-sm text-slate-400">{status}</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="mb-3 text-xl font-semibold">Módulos del sistema</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {modules.map(m => (
            <Link href={m.href} key={m.href} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-teal-500/60 hover:bg-slate-900">
              <h3 className="font-semibold text-white">{m.title} <span aria-hidden className="text-teal-300">→</span></h3>
              <p className="mt-2 text-sm text-slate-400">{m.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <p className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-4 text-sm text-amber-200">Importante: esta primera entrega contiene la estructura y pantallas base. Aún no opera sin internet, no calcula tarifas ni guarda movimientos reales.</p>
    </div>
  );
}
