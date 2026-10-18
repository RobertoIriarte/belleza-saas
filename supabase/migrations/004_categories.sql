-- Categorías de servicios (Cabello, Uñas, Barba…) administrables por cada centro.
-- Seguro de ejecutar más de una vez.

create table if not exists public.service_categories (
  id          uuid primary key default gen_random_uuid(),
  center_id   uuid not null references public.centers(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create unique index if not exists service_categories_name_uniq
  on public.service_categories (center_id, lower(name));

-- Si se borra una categoría, sus servicios quedan sin categoría (no se borran)
alter table public.services
  add column if not exists category_id uuid references public.service_categories(id) on delete set null;

create index if not exists services_category_idx on public.services (category_id);

alter table public.service_categories enable row level security;

drop policy if exists "categories: lectura pública" on public.service_categories;
drop policy if exists "categories: dueño escribe"   on public.service_categories;

create policy "categories: lectura pública"
  on public.service_categories for select using (true);

create policy "categories: dueño escribe"
  on public.service_categories for all
  using (public.owns_center(center_id))
  with check (public.owns_center(center_id));

-- Convierte el texto libre que ya existía en categorías reales
insert into public.service_categories (center_id, name, sort_order)
select center_id, name, (row_number() over (partition by center_id order by name) - 1)::int
from (
  select distinct center_id, btrim(category) as name
  from public.services
  where category is not null and btrim(category) <> ''
) t
on conflict do nothing;

update public.services s
set category_id = c.id
from public.service_categories c
where s.category_id is null
  and s.category is not null
  and c.center_id = s.center_id
  and lower(c.name) = lower(btrim(s.category));
