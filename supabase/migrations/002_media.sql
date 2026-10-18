-- =====================================================================
-- Migración 002 · Imágenes de centros (logo, portada, fotos del equipo)
-- Ejecutar en: Supabase > SQL Editor (una sola vez, es idempotente)
-- =====================================================================

alter table public.centers add column if not exists logo_url  text;
alter table public.centers add column if not exists cover_url text;

-- Bucket público de lectura (las imágenes se ven en el sitio sin login).
-- Límite de 5 MB por archivo y sólo formatos de imagen web.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'center-media',
  'center-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Cada archivo vive en la carpeta del centro: <center_id>/<archivo>.
-- Sólo el dueño de ese centro puede subir, reemplazar o borrar.
-- (No hay política de lectura: el bucket es público y así no se puede listar su contenido.)
drop policy if exists "center-media: dueño sube"   on storage.objects;
drop policy if exists "center-media: dueño edita"  on storage.objects;
drop policy if exists "center-media: dueño borra"  on storage.objects;

create policy "center-media: dueño sube"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'center-media'
    and public.owns_center(((storage.foldername(name))[1])::uuid)
  );

create policy "center-media: dueño edita"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'center-media'
    and public.owns_center(((storage.foldername(name))[1])::uuid)
  );

create policy "center-media: dueño borra"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'center-media'
    and public.owns_center(((storage.foldername(name))[1])::uuid)
  );
