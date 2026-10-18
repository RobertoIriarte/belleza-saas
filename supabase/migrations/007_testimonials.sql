-- Testimonios de clientes que el centro publica en su sitio. Seguro de ejecutar más de una vez.
create table if not exists public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  center_id   uuid not null references public.centers(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 80),
  body        text not null check (char_length(body) between 1 and 500),
  rating      int  not null default 5 check (rating between 1 and 5),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists testimonials_center_idx
  on public.testimonials (center_id, created_at desc);

alter table public.testimonials enable row level security;

drop policy if exists "testimonials: lectura pública" on public.testimonials;
drop policy if exists "testimonials: dueño escribe"   on public.testimonials;

-- El público sólo ve los activos; el dueño ve todos
create policy "testimonials: lectura pública"
  on public.testimonials for select using (active or public.owns_center(center_id));

create policy "testimonials: dueño escribe"
  on public.testimonials for all
  using (public.owns_center(center_id))
  with check (public.owns_center(center_id));
