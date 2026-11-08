import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "ParkingControl | Estructura inicial",
  description: "Plantilla de arquitectura para sistema de parqueadero online y offline",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/parking.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
