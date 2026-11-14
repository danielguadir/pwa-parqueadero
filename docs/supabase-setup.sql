-- =======================================================
-- ESQUEMA SQL PARA PARQUEADEROGP EN SUPABASE
-- Pega este código en Supabase -> SQL Editor -> Run
-- =======================================================

create table if not exists public.movimientos (
  id text primary key,
  codigo text not null,
  placa text not null,
  placa_normalizada text not null,
  tipo_vehiculo text not null,
  nombre text not null,
  nombre_normalizado text not null,
  celular text,
  cedula text,
  fecha_ingreso text not null,
  fecha_salida text,
  tarifa_aplicada numeric not null,
  estado_vehiculo text not null,
  estado_pago text not null,
  fecha_pago text,
  fecha_actualizacion text not null
);

-- Índices de alto rendimiento
create index if not exists idx_movimientos_placa on public.movimientos (placa_normalizada);
create index if not exists idx_movimientos_codigo on public.movimientos (codigo);
create index if not exists idx_movimientos_estado on public.movimientos (estado_vehiculo);

-- Permitir lectura y escritura pública para el evento
alter table public.movimientos enable row level security;

drop policy if exists "Permitir todo para ParqueaderoGP" on public.movimientos;
create policy "Permitir todo para ParqueaderoGP"
  on public.movimientos
  for all
  to anon, authenticated, service_role
  using (true)
  with check (true);
