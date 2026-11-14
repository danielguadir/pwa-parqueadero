import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permitir acceso desde dispositivos móviles en la red local
  },
  // Permitir orígenes de desarrollo en red local (ej. celular)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  allowedDevOrigins: ["localhost", "localhost:3000", "192.168.100.45", "192.168.100.45:3000"],
};

export default nextConfig;
