import type { VehicleCategory, TariffConfig, FeeCalculationResult } from "@/types/parking";

export const DEFAULT_TARIFF_CONFIG: TariffConfig = {
  carHourlyRate: 3500,           // $3.500 COP por hora de automóvil
  motorcycleHourlyRate: 1800,    // $1.800 COP por hora de motocicleta
  otherHourlyRate: 4500,         // $4.500 COP por hora de vehículo especial / pesado
  gracePeriodMinutes: 10,        // 10 minutos de cortesía sin costo
  chargeFractionAfterHour: true, // Fracciona bloques de 15 min después de la primera hora
  fractionBlockMinutes: 15,      // Bloques de 15 minutos
};

/**
 * Calcula de forma determinista el costo de estacionamiento según el tiempo transcurrido y la categoría.
 */
export function calculateParkingFee(
  enteredAtIso: string,
  exitedAtIso: string = new Date().toISOString(),
  category: VehicleCategory = "CAR",
  config: TariffConfig = DEFAULT_TARIFF_CONFIG
): FeeCalculationResult {
  const entered = new Date(enteredAtIso).getTime();
  const exited = new Date(exitedAtIso).getTime();
  const diffMs = Math.max(0, exited - entered);
  const totalMinutes = Math.max(1, Math.ceil(diffMs / (1000 * 60)));

  const hourlyRate =
    category === "CAR"
      ? config.carHourlyRate
      : category === "MOTORCYCLE"
      ? config.motorcycleHourlyRate
      : config.otherHourlyRate;

  // 1. Periodo de gracia / cortesía
  if (totalMinutes <= config.gracePeriodMinutes) {
    return {
      totalMinutes,
      billableMinutes: 0,
      amountDue: 0,
      isGracePeriod: true,
      breakdown: `Periodo de cortesía (${totalMinutes} min transcurridos <= ${config.gracePeriodMinutes} min de gracia)`,
    };
  }

  // 2. Primera hora (hasta 60 minutos)
  if (totalMinutes <= 60) {
    return {
      totalMinutes,
      billableMinutes: totalMinutes,
      amountDue: hourlyRate,
      isGracePeriod: false,
      breakdown: `1 hora estándar (${totalMinutes} min)`,
    };
  }

  // 3. Más de una hora con fraccionamiento
  const extraMinutes = totalMinutes - 60;

  if (config.chargeFractionAfterHour && config.fractionBlockMinutes > 0) {
    const blocksPerHour = 60 / config.fractionBlockMinutes;
    // Valor por bloque redondeado al entero más cercano
    const fractionPrice = Math.round(hourlyRate / blocksPerHour);
    const fractionBlocks = Math.ceil(extraMinutes / config.fractionBlockMinutes);
    const totalFractionFee = fractionBlocks * fractionPrice;
    const amountDue = hourlyRate + totalFractionFee;

    return {
      totalMinutes,
      billableMinutes: totalMinutes,
      amountDue,
      isGracePeriod: false,
      breakdown: `1 hora ($${hourlyRate.toLocaleString("es-CO")}) + ${fractionBlocks} fracción(es) de ${config.fractionBlockMinutes}m ($${totalFractionFee.toLocaleString("es-CO")})`,
    };
  }

  // Cobro por horas completas redondeadas hacia arriba
  const totalHours = Math.ceil(totalMinutes / 60);
  const amountDue = totalHours * hourlyRate;

  return {
    totalMinutes,
    billableMinutes: totalMinutes,
    amountDue,
    isGracePeriod: false,
    breakdown: `${totalHours} horas completas ($${hourlyRate.toLocaleString("es-CO")} c/u)`,
  };
}
