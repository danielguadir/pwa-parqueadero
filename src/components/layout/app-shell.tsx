"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import { ConnectionStatus } from "./connection-status";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const NAV_PRINCIPAL: NavItem[] = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/entradas", label: "Ingresar Vehículo", icon: "entrada" },
  { href: "/salidas", label: "Retirar Vehículo", icon: "salida" },
  { href: "/historial", label: "Historial y Pagos", icon: "lista" },
];

const NAV_INFERIOR: NavItem = { href: "/configuracion", label: "Configuración", icon: "ajustes" };

const TITULOS: Record<string, string> = {
  "/": "Inicio",
  "/entradas": "Ingreso de Vehículo",
  "/salidas": "Retiro de Vehículo",
  "/historial": "Historial y Pagos",
  "/configuracion": "Configuración y Respaldos",
};

function NavLink({ item, activo, onNavigate }: { item: NavItem; activo: boolean; onNavigate: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition",
        activo
          ? "bg-gradient-to-r from-primary-strong to-primary-hover text-white shadow-md"
          : "text-ink-muted hover:bg-canvas hover:text-ink"
      )}
    >
      <Icon name={item.icon} className="h-5 w-5 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <div className="min-h-dvh bg-canvas md:flex">
      {/* Fondo oscuro del menú en celular */}
      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={cerrarMenu}
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
        />
      )}

      {/* Barra lateral */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface p-4 transition-transform md:sticky md:top-0 md:h-dvh md:translate-x-0",
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-6 flex items-center justify-between px-2 pt-2">
          <Link href="/" onClick={cerrarMenu} className="text-xl font-black tracking-tight text-ink">
            ParqueaderoGP
          </Link>
          <button
            type="button"
            onClick={cerrarMenu}
            aria-label="Ocultar menú"
            className="rounded-md p-1 text-ink hover:bg-canvas md:hidden"
          >
            <Icon name="chevronIzquierda" className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1">
          {NAV_PRINCIPAL.map((item) => (
            <NavLink key={item.href} item={item} activo={pathname === item.href} onNavigate={cerrarMenu} />
          ))}
        </nav>

        <div className="border-t border-line pt-3">
          <NavLink item={NAV_INFERIOR} activo={pathname === NAV_INFERIOR.href} onNavigate={cerrarMenu} />
        </div>
      </aside>

      {/* Área principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 shadow-sm backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
              className="rounded-md p-2 text-ink hover:bg-canvas md:hidden"
            >
              <Icon name="menu" className="h-6 w-6" />
            </button>
            <span className="truncate text-base font-semibold text-ink">{TITULOS[pathname] ?? "ParqueaderoGP"}</span>
          </div>

          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas text-sm font-semibold text-ink">
                O
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-ink">Operador</p>
                <p className="text-xs text-ink-muted">PARQUEADERO</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-4 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
