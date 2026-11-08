import Link from "next/link";

const menu = [
  ["/dashboard", "Panel principal"],
  ["/entradas", "Entradas"],
  ["/salidas", "Salidas"],
  ["/historial", "Historial"],
  ["/tarifas", "Tarifas"],
  ["/reportes", "Reportes"],
  ["/usuarios", "Usuarios"],
  ["/configuracion", "Configuración"],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-slate-800 bg-slate-950/80 p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-white">▣ ParkingControl</Link>
        <p className="mt-1 text-xs text-teal-300">Estructura inicial · v0.1</p>
        <nav aria-label="Navegación principal" className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-1">
          {menu.map(([href,label]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-teal-400">{label}</Link>
          ))}
        </nav>
      </aside>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-10 md:py-10">
        {children}
      </main>
    </div>
  );
}
