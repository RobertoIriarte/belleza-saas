-- Tipo de negocio del centro (adapta textos del sitio). Seguro de ejecutar más de una vez.
alter table public.centers add column if not exists business_type text not null default 'belleza';
