# ParkingControl — plantilla inicial de arquitectura (v0.1)

Base descargable para construir una aplicación de gestión de parqueaderos online/offline.
La plantilla **sí inicia como proyecto Next.js**, pero **todavía no registra vehículos, cobra dinero, autentica ni sincroniza operaciones**. Las páginas de módulos son puntos de partida, no funciones terminadas.

## Stack previsto
- Next.js 16, React 19, TypeScript y Tailwind CSS 4.
- PostgreSQL / Supabase y Prisma 7 para la base central.
- IndexedDB + Dexie para datos del dispositivo; sincronización por API en fases futuras.
- Publicación prevista en Vercel y repositorio GitHub.

## Antes de empezar
1. Instala Node.js compatible con Next.js 16 y Prisma 7 (recomendado Node.js 22.12 o posterior).
2. Abre **esta carpeta** (`ParkingControl`) en Visual Studio Code.
3. Ejecuta estos comandos en la terminal:

```bash
npm install
npm run dev
```

4. Abre http://localhost:3000 . El panel y las rutas de los módulos son pantallas de preparación.
5. Prueba la ruta de verificación estructural: http://localhost:3000/api/health .

No hace falta configurar PostgreSQL para abrir la plantilla inicial.

## Base de datos (cuando lleguemos a la fase 2)
1. Duplica `.env.example` y renómbralo `.env` (no lo publiques ni subas credenciales al repositorio).
2. Configura `DATABASE_URL` (conexión de la aplicación) y `DIRECT_URL` (migraciones, sin pooler).
3. Instala dependencias si aún no lo hiciste; ejecuta `npm run db:generate` y luego `npm run db:migrate` con una base de pruebas.
4. El archivo `prisma/schema.prisma` es un **modelo preliminar**, todavía sujeto a validaciones de negocio y migraciones.

## Comandos

```bash
npm run dev          # servidor local de desarrollo
npm run build        # compilar la plantilla
npm run start        # iniciar versión compilada
npm run lint         # revisión estática
npm run test:tree    # valida estructura y READMEs
npm run db:generate  # genera cliente Prisma (requiere dependencias)
npm run db:migrate   # crea/aplica migraciones (requiere DB y .env)
```

## Estructura y orientación
- `src/app/`: pantallas y endpoints HTTP.
- `src/components/`: bloques reutilizables de interfaz.
- `src/features/`: reglas organizadas por dominio (parqueo, cobros y sincronización).
- `src/lib/`: adaptadores, conectores y utilidades técnicas.
- `src/types/`: contratos compartidos de TypeScript.
- `prisma/`: modelo relacional y migraciones futuras.
- `public/`: íconos, manifiesto y archivos estáticos.
- `docs/`: decisiones técnicas, fases y requisitos de aceptación.
- `tests/`: pruebas automatizadas (por ahora solo estructura).

**Cada carpeta relevante tiene su propio README.md de dos líneas descriptivas**, además del título.

## Principios para la implementación real
- Offline-first: guardar localmente y marcar como pendiente hasta tener confirmación remota.
- Operaciones con UUID, sincronización idempotente, manejo explícito de conflictos y auditoría.
- No prometer modo sin conexión completo hasta desarrollar, probar y registrar correctamente el Service Worker.
- No almacenar contraseñas o secretos en IndexedDB ni exponer claves privadas en el cliente.

## Orden sugerido
1. Completar reglas de tarifas y modelo de datos.
2. Implementar endpoints, permisos y transacciones.
3. Implementar altas/bajas de estancias con pruebas.
4. Añadir base local, sincronizador, detección de conflictos y PWA offline.
5. Evaluar con 2.000 movimientos y pruebas de pérdida de conexión.
