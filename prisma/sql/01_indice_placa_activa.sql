-- SQL de referencia para una futura migración revisada; NO se ejecuta automáticamente.
-- Impide dos estancias abiertas para el mismo vehículo en el mismo parqueadero.
-- Antes de aplicarlo, revisar la política real de múltiples accesos y datos existentes.
CREATE UNIQUE INDEX IF NOT EXISTS parking_unique_active_vehicle
ON "ParkingSession" ("parkingLotId", "vehicleId")
WHERE "status" = 'OPEN';
