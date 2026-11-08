# Plan de sincronización online/offline

1. Crear en navegador una operación con UUID y fecha UTC, junto a su modificación local, dentro de una transacción de IndexedDB.
2. Mostrar el estado `PENDING` sin afirmar que la nube recibió el movimiento.
3. Al recuperar conectividad, enviar operaciones en orden causal mediante API autenticada.
4. El backend valida permisos, duplicados, capacidad, regla de placa activa y registra la decisión en una transacción.
5. El cliente recibe por UUID `CONFIRMED`, `CONFLICT` o `REJECTED` y actualiza su cola de forma transaccional.
6. Se probarán cierres/reaperturas, redes intermitentes, reenvíos, rechazo de servidor y doble dispositivo.

**Pendiente de implementación:** PWA offline real, cola funcional, API real, políticas de resolución de conflictos y recuperación ante borrado de datos.
