/**
 * Generador de UUID v4 universal y resiliente.
 * Funciona de manera confiable en:
 * - Contextos seguros (HTTPS o localhost) usando crypto.randomUUID si está disponible.
 * - Contextos NO seguros (como HTTP en red local http://192.168.x.x:3000 desde el celular)
 * - Navegadores móviles, WebViews y entornos Node.js.
 */
export function generarUUID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    try {
      return crypto.randomUUID();
    } catch {
      // Si falla en algún contexto restringido, continuar al fallback
    }
  }

  // Fallback estándar RFC4122 v4 basado en crypto.getRandomValues o Math.random
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    try {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
        .join("")
        .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
    } catch {
      // Fallback a Math.random
    }
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Genera un código aleatorio de 6 caracteres compuesto por letras mayúsculas y números
 * (ej: "K7M9P2", "A3X8B1"). Fácil de dictar, memorizar o buscar rápidamente.
 */
export function generarCodigoVehiculo(longitud = 6): string {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";
  for (let i = 0; i < longitud; i++) {
    const idx = Math.floor(Math.random() * caracteres.length);
    codigo += caracteres.charAt(idx);
  }
  return codigo;
}
