-- Paleta de colores elegida por cada centro. Seguro de ejecutar más de una vez.
-- Los centros que ya existían quedan en 'personalizado' (conservan su color actual);
-- los nuevos parten con 'rosa'.
alter table public.centers add column if not exists palette text not null default 'personalizado';
alter table public.centers alter column palette set default 'rosa';
