import "dotenv/config";
import { defineConfig } from "prisma/config";

// En despliegue, la aplicación utiliza DATABASE_URL y migraciones usan DIRECT_URL.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "" },
});
