export type TipoVehiculo = "CARRO" | "MOTO";
export type EstadoVehiculo = "DENTRO" | "RETIRADO";
export type EstadoPago = "PAGADO" | "PENDIENTE";
export type ZonaParqueadero = "CENTRAL" | "NORTE" | "SUR" | "ORIENTE" | "OCCIDENTE";

export const ZONAS_PARQUEADERO: ZonaParqueadero[] = [
  "CENTRAL",
  "NORTE",
  "SUR",
  "ORIENTE",
  "OCCIDENTE",
];

export interface MovimientoParqueadero {
  id: string;                      // UUID único
  codigo: string;                  // Código único compuesto: 4 caracteres + Zona (ej: K7M9-SUR)
  zona?: string;                   // Zona asignada (CENTRAL | NORTE | SUR | ORIENTE | OCCIDENTE)
  placa: string;                   // Placa tal como la escribe el operador
  placaNormalizada: string;        // Mayúsculas, sin espacios ni guiones (índice)
  tipoVehiculo: TipoVehiculo;       // CARRO | MOTO
  nombre: string;                  // Nombre del conductor/responsable (obligatorio)
  nombreNormalizado: string;       // Minúsculas, sin tildes para búsqueda instantánea
  celular?: string;                // Opcional
  cedula?: string;                 // Opcional (para búsqueda)
  fechaIngreso: string;            // ISO-8601 UTC
  fechaSalida?: string | null;     // ISO-8601 UTC al retirar
  tarifaAplicada: number;          // Tarifa fija congelada en el momento del ingreso ($ COP)
  estadoVehiculo: EstadoVehiculo;  // DENTRO | RETIRADO
  estadoPago: EstadoPago;          // PENDIENTE | PAGADO
  fechaPago?: string | null;       // ISO-8601 UTC cuando se realiza el pago
  fechaActualizacion: string;      // ISO-8601 UTC
}

export interface ConfiguracionParqueadero {
  tarifaCarro: number;             // Valor por defecto: 4000
  tarifaMoto: number;              // Valor por defecto: 1500
  nombreEvento: string;            // Nombre del evento
  ultimaCopiaSeguridad?: string | null;
}

export interface ResumenInicio {
  vehiculosDentro: number;
  totalIngresados: number;
  vehiculosRetirados: number;
  totalRecaudado: number;          // SOLO suma registros con estadoPago === "PAGADO"
  pagosPendientes: number;         // Conteo de registros con estadoPago === "PENDIENTE"
}

export type FiltroHistorial = "TODOS" | "DENTRO" | "RETIRADOS" | "PAGADOS" | "PENDIENTES";

export interface RegistroIngresoInput {
  placa: string;
  tipoVehiculo: TipoVehiculo;
  nombre: string;
  celular?: string;
  cedula?: string;
  zona?: ZonaParqueadero | string;
}

export interface RegistroRetiroInput {
  id: string;
  estadoPago: EstadoPago;
}
