-- Foto opcional para cada categoría de servicios. Seguro de ejecutar más de una vez.
alter table public.service_categories add column if not exists image_url text;
