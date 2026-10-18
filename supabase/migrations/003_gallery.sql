-- =====================================================================
-- Migración 003 · Galería de trabajos del centro
-- Ejecutar DESPUÉS de schema.sql y 002_media.sql, en: Supabase > SQL Editor
-- Es idempotente: se puede ejecutar más de una vez.
-- =====================================================================

create table if not exists public.gallery_images (
  id         uuid primary key default gen_random_uuid(),
  center_id  uuid not null references public.centers(id) on delete cascade,
  url        text not null,
  created_at timestamptz not null default now()
);

create index if not exists gallery_images_center_idx
  on public.gallery_images (center_id, created_at desc);

alter table public.gallery_images enable row level security;

drop policy if exists "gallery: lectura pública" on public.gallery_images;
drop policy if exists "gallery: dueño escribe"   on public.gallery_images;

-- Cualquiera puede ver las fotos publicadas (van en el sitio público)
create policy "gallery: lectura pública"
  on public.gallery_images for select using (true);

-- Sólo el dueño del centro agrega o elimina fotos
create policy "gallery: dueño escribe"
  on public.gallery_images for all
  using (public.owns_center(center_id))
  with check (public.owns_center(center_id));
