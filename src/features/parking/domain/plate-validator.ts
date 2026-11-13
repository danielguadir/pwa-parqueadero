import type { VehicleCategory, EntryValidationResult } from "@/types/parking";

// Patrones comunes en Colombia y Latinoamérica
const CAR_PATTERN = /^[A-Z]{3}\d{3}$/;                  // Automóviles particulares/públicos: ABC123
const MOTO_PATTERN_MODERN = /^[A-Z]{3}\d{2}[A-Z]$/;     // Motocicletas modernas: ABC12D
const MOTO_PATTERN_CLASSIC = /^[A-Z]{3}\d{2}$/;         // Motocicletas clásicas: ABC12
const GENERAL_ALPHANUMERIC = /^[A-Z0-9]{4,8}$/;         // Formatos diplomáticos, remolques u otros

/**
 * Normaliza una placa removiendo espacios, guiones, puntos y convirtiendo a mayúsculas.
 */
export function normalizePlate(rawPlate: string): string {
  if (!rawPlate) return "";
  return rawPlate
    .trim()
    .toUpperCase()
    .replace(/[\s\-_.]/g, "");
}

/**
 * Infiere la categoría más probable de un vehículo a partir del formato de la placa.
 */
export function inferVehicleCategory(plateNormalized: string): VehicleCategory {
  if (MOTO_PATTERN_MODERN.test(plateNormalized) || MOTO_PATTERN_CLASSIC.test(plateNormalized)) {
    return "MOTORCYCLE";
  }
  if (CAR_PATTERN.test(plateNormalized)) {
    return "CAR";
  }
  return "OTHER";
}

/**
 * Valida si la placa cumple con los requerimientos de estructura y formato.
 */
export function validatePlate(rawPlate: string): EntryValidationResult {
  const normalizedPlate = normalizePlate(rawPlate);

  if (!normalizedPlate) {
    return {
      isValid: false,
      normalizedPlate: "",
      suggestedType: "CAR",
      error: "La placa no puede estar vacía.",
    };
  }

  if (normalizedPlate.length < 4) {
    return {
      isValid: false,
      normalizedPlate,
      suggestedType: "CAR",
      error: "La placa es demasiado corta (mínimo 4 caracteres).",
    };
  }

  if (normalizedPlate.length > 8) {
    return {
      isValid: false,
      normalizedPlate,
      suggestedType: "CAR",
      error: "La placa es demasiado larga (máximo 8 caracteres).",
    };
  }

  if (!GENERAL_ALPHANUMERIC.test(normalizedPlate)) {
    return {
      isValid: false,
      normalizedPlate,
      suggestedType: "OTHER",
      error: "La placa solo puede contener letras y números sin caracteres especiales.",
    };
  }

  const suggestedType = inferVehicleCategory(normalizedPlate);

  return {
    isValid: true,
    normalizedPlate,
    suggestedType,
  };
}
