/**
 * Utilidad para solicitar almacenamiento persistente en el navegador.
 * Evita que el navegador limpie la base de datos IndexedDB si el dispositivo tiene poco espacio.
 */
export async function solicitarAlmacenamientoPersistente(): Promise<{
  soportado: boolean;
  persistido: boolean;
  mensaje: string;
}> {
  if (typeof window === "undefined" || !navigator.storage || !navigator.storage.persist) {
    return {
      soportado: false,
      persistido: false,
      mensaje: "Almacenamiento persistente no soportado en este navegador. Se recomienda realizar copias de seguridad manuales periódicas.",
    };
  }

  try {
    const yaPersistido = await navigator.storage.persisted();
    if (yaPersistido) {
      return {
        soportado: true,
        persistido: true,
        mensaje: "Almacenamiento persistente activo. Los datos están protegidos contra limpieza automática del sistema.",
      };
    }

    const concedido = await navigator.storage.persist();
    return {
      soportado: true,
      persistido: concedido,
      mensaje: concedido
        ? "Almacenamiento persistente concedido con éxito."
        : "El navegador no otorgó almacenamiento persistente automático. Es indispensable realizar respaldos JSON periódicos.",
    };
  } catch (err) {
    console.warn("[StoragePersistence] Error al solicitar almacenamiento persistente:", err);
    return {
      soportado: true,
      persistido: false,
      mensaje: "No se pudo verificar la persistencia. Realice respaldos periódicos.",
    };
  }
}
