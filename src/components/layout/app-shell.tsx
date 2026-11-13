import Link from "next/link";
import { SyncStatusIndicator } from "./sync-status-indicator";

const menu = [
  ["/dashboard", "Panel principal", "📊"],
  ["/entradas", "Entradas", "🚗"],
  ["/salidas", "Salidas / Cobro", "💳"],
  ["/historial", "Historial", "📜"],
  ["/tarifas", "Tarifas", "🏷️"],
  ["/reportes", "Reportes", "📈"],
  ["/usuarios", "Operadores", "👥"],
  ["/configuracion", "Configuración", "⚙️"],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">
      {/* Barra lateral / Navegación */}
      <aside className="border-b border-slate-800 bg-slate-900/90 p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:p-6">
        <div className="flex items-center justify-between md:block">
          <div>
            <Link href="/dashboard" className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 font-bold text-slate-950 shadow-md shadow-teal-500/20">
                P
              </span>
              ParkingControl
            </Link>
            <p className="mt-1 text-xs font-medium text-teal-400">PWA Offline-First · v1.0</p>
          </div>
        </div>

        <nav aria-label="Navegación principal" className="mt-5 grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:mt-8 md:grid-cols-1">
          {menu.map(([href, label, icon]) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-teal-400 md:text-sm"
            >
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 md:px-10 md:py-8">
        <div className="mb-6">
          <SyncStatusIndicator />
        </div>
        {children}
      </main>
    </div>
  );
}
