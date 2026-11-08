# Modelo de datos preliminar

El esquema inicial está en `prisma/schema.prisma`: `ParkingLot`, `Vehicle`, `AppUser`, `Tariff`, `ParkingSession`, `Payment`, `Device`, `SyncOperation` y `AuditLog`.

- Una estancia se abre con `enteredAt` y termina al asignar `exitedAt` y pasar a estado `CLOSED`.
- El dinero se maneja con enteros (`amountCents`/`totalCents`) para evitar cálculos imprecisos de coma flotante; para COP puede evaluarse renombrar a `amountMinorUnits` antes de implementar.
- El índice SQL complementario impide dos estancias abiertas del mismo vehículo en el mismo parqueadero.
- Antes de migrar a producción, acordar política de tarifa, fracciones, cierres de caja, exenciones y cancelaciones.
