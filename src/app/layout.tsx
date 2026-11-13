import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { SwRegister } from "@/components/pwa/sw-register";

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "ParkingControl - Sistema de Parqueaderos",
  description: "Sistema offline-first para control de entradas, salidas y cobro de parqueaderos",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/parking.svg", apple: "/icons/parking.svg" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ParkingControl",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-teal-500 selection:text-white">
        <SwRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
