import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { SwRegister } from "@/components/pwa/sw-register";

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "ParqueaderoGP - Control de Parqueadero",
  description: "Control offline de ingresos, retiros y pagos del parqueadero",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/parking.svg", apple: "/icons/parking.svg" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ParqueaderoGP",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <SwRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
