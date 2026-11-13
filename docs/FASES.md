# Plan Estratégico del Proyecto en 3 Partes

Para garantizar escalabilidad, mantenibilidad y entrega operativa rápida, el desarrollo se organiza en 3 grandes partes:

| Parte | Enfoque y Entregables | Estado |
|---|---|---|
| **Parte 1** | **Núcleo Operativo Local y Entradas de Vehículos (Offline-First)**<br>• Normalización estricta de placas y detección automática de categoría.<br>• Persistencia atómica en Dexie/IndexedDB (`sessions`, `vehicles`, `pendingOperations`, `configs`).<br>• Prevención de estancias duplicadas en tiempo real.<br>• Control de cupos y capacidad nominal (Carros/Motos).<br>• Pantalla `/entradas` interactiva de alta velocidad para el operador.<br>• Emisión de tiquete digital/imprimible con ID único.<br>• Suite de pruebas automatizadas (10/10 tests aprobados). | **IMPLEMENTADO Y VERIFICADO** |
| **Parte 2** | **Ciclo de Salidas, Motor de Tarifas y Recaudo**<br>• Motor de cobro configurable (bloques, minutos, periodos de gracia).<br>• Módulo `/salidas` con búsqueda instantánea y cálculo automático del monto.<br>• Registro de pago, liberación de cupo y cierre de estancia.<br>• Módulo `/historial` con filtros por fecha, placa y arqueo de caja.<br>• Pruebas de cálculo tarifario y cuadre financiero. | Pendiente (Siguiente paso) |
| **Parte 3** | **Sincronización Nube, Service Worker PWA, Roles y Reportes**<br>• API de sincronización bidireccional (`/api/sync`) con PostgreSQL / Supabase.<br>• Reconciliación de cola `pendingOperations` con idempotencia por UUID.<br>• Service Worker para caché estática y funcionamiento 100% PWA instalable.<br>• Módulos de `/reportes` y administración de `/usuarios`.<br>• Pruebas de estrés con 2.000 registros y cortes de red. | Planificada |
