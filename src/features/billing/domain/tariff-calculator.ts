import type { VehicleCategory, TariffConfig, FeeCalculationResult } from "@/types/parking";

export const DEFAULT_TARIFF_CONFIG: TariffConfig = {
  billingMode: "FLAT",           // Cobro fijo por defecto, independiente del tiempo
  carFlatRate: 4000,             // $4.000 COP tarifa fija automóvil
  motorcycleFlatRate: 1500,      // $1.500 COP tarifa fija motocicleta
  otherFlatRate: 6000,           // $6.000 COP otros
  carHourlyRate: 4000,           // $4.000 COP si se usa por horas
  motorcycleHourlyRate: 1500,    // $1.500 COP si se usa por horas
  otherHourlyRate: 6000,
  gracePeriodMinutes: 10,        // 10 minutos de cortesía
  chargeFractionAfterHour: false,
  fractionBlockMinutes: 15,
};

/**
 * Calcula el costo de estacionamiento.
 * Por defecto aplica cobro de tarifa fija ($4.000 carro / $1.500 moto) independientemente del tiempo.
 */
export function calculateParkingFee(
  enteredAtIso: string,
  exitedAtIso: string = new Date().toISOString(),
  category: VehicleCategory = "CAR",
  config: TariffConfig = DEFAULT_TARIFF_CONFIG,
  agreedRate?: number
): FeeCalculationResult {
  const entered = new Date(enteredAtIso).getTime();
  const exited = new Date(exitedAtIso).getTime();
  const diffMs = Math.max(0, exited - entered);
  const totalMinutes = Math.max(1, Math.ceil(diffMs / (1000 * 60)));

  // 1. Si existe tarifa acordada o el modo es tarifa fija (FLAT):
  if (typeof agreedRate === "number" && agreedRate >= 0) {
    return {
      totalMinutes,
      billableMinutes: totalMinutes,
      amountDue: agreedRate,
      isGracePeriod: false,
      breakdown: `Tarifa única acordada al ingreso: $${agreedRate.toLocaleString("es-CO")} COP`,
    };
  }

  if (config.billingMode === "FLAT") {
    const flatRate =
      category === "CAR"
        ? config.carFlatRate
        : category === "MOTORCYCLE"
        ? config.motorcycleFlatRate
        : config.otherFlatRate;

    return {
      totalMinutes,
      billableMinutes: totalMinutes,
      amountDue: flatRate,
      isGracePeriod: false,
      breakdown: `Tarifa única fija (${category === "CAR" ? "Automóvil" : category === "MOTORCYCLE" ? "Moto" : "Otro"}): $${flatRate.toLocaleString("es-CO")} COP`,
    };
  }

  // 2. Modo alternativo por tiempo (si el administrador lo activa):
  const hourlyRate =
    category === "CAR"
      ? config.carHourlyRate
      : category === "MOTORCYCLE"
      ? config.motorcycleHourlyRate
      : config.otherHourlyRate;

  if (totalMinutes <= config.gracePeriodMinutes) {
    return {
      totalMinutes,
      billableMinutes: 0,
      amountDue: 0,
      isGracePeriod: true,
      breakdown: `Periodo de cortesía (${totalMinutes} min transcurridos <= ${config.gracePeriodMinutes} min de gracia)`,
    };
  }

  if (totalMinutes <= 60) {
    return {
      totalMinutes,
      billableMinutes: totalMinutes,
      amountDue: hourlyRate,
      isGracePeriod: false,
      breakdown: `1 hora estándar (${totalMinutes} min)`,
    };
  }

  const extraMinutes = totalMinutes - 60;
  if (config.chargeFractionAfterHour && config.fractionBlockMinutes > 0) {
    const blocksPerHour = 60 / config.fractionBlockMinutes;
    const fractionPrice = Math.round(hourlyRate / blocksPerHour);
    const fractionBlocks = Math.ceil(extraMinutes / config.fractionBlockMinutes);
    const totalFractionFee = fractionBlocks * fractionPrice;
    const amountDue = hourlyRate + totalFractionFee;

    return {
      totalMinutes,
      billableMinutes: totalMinutes,
      amountDue,
      isGracePeriod: false,
      breakdown: `1 hora ($${hourlyRate.toLocaleString("es-CO")}) + ${fractionBlocks} fracción(es) ($${totalFractionFee.toLocaleString("es-CO")})`,
    };
  }

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
