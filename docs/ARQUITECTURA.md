# Arquitectura propuesta

**Estado:** diseño base, todavía no es un sistema operativo.

```text
PWA Next.js (navegador)
  ├─ Pantallas y lógica de presentación
  ├─ IndexedDB (cola de operaciones, futuro)
  └─ Service Worker (pendiente)
        ↕ HTTPS / sincronización autenticada
Next.js Route Handlers (Vercel)
  └─ Servicios de negocio, validación e idempotencia
        ↕
PostgreSQL (Supabase) + Prisma
```

## Decisiones importantes
- Separar rutas visuales de API y de reglas de negocio.
- Nunca dar por confirmada una operación solo por guardarla en IndexedDB.
- Asignar UUID a cada operación para que reintentar no duplique movimientos.
- Si hay varios operadores offline sin red local compartida, se necesitan reglas de conflictos.
- No almacenar secretos ni permisos confiables en el navegador.
