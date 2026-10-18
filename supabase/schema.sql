-- =====================================================================
-- Belleza SaaS · Esquema multi-centro (Supabase / Postgres)
-- Ejecutar completo en: Supabase > SQL Editor
-- =====================================================================

create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Centros (tenants)
-- ---------------------------------------------------------------------
create table public.centers (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  name          text not null,
  tagline       text,
  description   text,
  phone         text,
  whatsapp      text,
  email         text,
  address       text,
  city          text,
  instagram     text,
  timezone      text not null default 'America/Santiago',
  accent_color  text not null default '#be185d',
  slot_step_min int  not null default 15 check (slot_step_min between 5 and 120),
  min_notice_min int not null default 60,
  max_days_ahead int not null default 60,
  owner_id      uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now()
);

create index centers_owner_idx on public.centers(owner_id);

-- ---------------------------------------------------------------------
-- Servicios
-- ---------------------------------------------------------------------
create table public.services (
  id            uuid primary key default gen_random_uuid(),
  center_id     uuid not null references public.centers(id) on delete cascade,
  name          text not null,
  description   text,
  category      text,
  duration_min  int  not null check (duration_min between 5 and 600),
  price         numeric(12,0) not null default 0 check (price >= 0),
  active        boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index services_center_idx on public.services(center_id);

-- ---------------------------------------------------------------------
-- Profesionales
-- ---------------------------------------------------------------------
create table public.professionals (
  id            uuid primary key default gen_random_uuid(),
  center_id     uuid not null references public.centers(id) on delete cascade,
  name          text not null,
  role          text,
  bio           text,
  photo_url     text,
  active        boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index professionals_center_idx on public.professionals(center_id);

-- Qué servicios realiza cada profesional
create table public.professional_services (
  professional_id uuid not null references public.professionals(id) on delete cascade,
  service_id      uuid not null references public.services(id) on delete cascade,
  primary key (professional_id, service_id)
);

-- ---------------------------------------------------------------------
-- Horarios semanales por profesional (0 = domingo ... 6 = sábado)
-- Se permiten varios tramos por día (ej. 09:00-13:00 y 15:00-19:00)
-- ---------------------------------------------------------------------
create table public.working_hours (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  weekday         int  not null check (weekday between 0 and 6),
  start_time      time not null,
  end_time        time not null,
  check (end_time > start_time)
);
create index working_hours_prof_idx on public.working_hours(professional_id);

-- Bloqueos (vacaciones, licencias, feriados puntuales)
create table public.time_off (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  reason          text,
  check (ends_at > starts_at)
);
create index time_off_prof_idx on public.time_off(professional_id);

-- ---------------------------------------------------------------------
-- Citas
-- ---------------------------------------------------------------------
create type public.appointment_status as enum
  ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

create type public.appointment_source as enum
  ('web', 'whatsapp', 'admin');

create table public.appointments (
  id               uuid primary key default gen_random_uuid(),
  center_id        uuid not null references public.centers(id) on delete cascade,
  professional_id  uuid not null references public.professionals(id) on delete restrict,
  service_id       uuid not null references public.services(id) on delete restrict,
  customer_name    text not null,
  customer_phone   text not null,
  customer_email   text,
  notes            text,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  status           public.appointment_status not null default 'confirmed',
  source           public.appointment_source not null default 'web',
  manage_token     uuid not null default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  check (ends_at > starts_at),

  -- Garantía a nivel de base de datos: un profesional no puede tener
  -- dos citas activas que se solapen, aunque lleguen al mismo tiempo.
  constraint no_double_booking exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);
create index appointments_center_time_idx on public.appointments(center_id, starts_at);
create index appointments_phone_idx on public.appointments(center_id, customer_phone);

-- =====================================================================
-- Row Level Security
-- Lectura pública de catálogo; escritura sólo del dueño del centro.
-- Las reservas públicas se insertan desde el servidor con service role
-- (ver src/app/actions/booking.ts), nunca directo desde el navegador.
-- =====================================================================
alter table public.centers               enable row level security;
alter table public.services              enable row level security;
alter table public.professionals         enable row level security;
alter table public.professional_services enable row level security;
alter table public.working_hours         enable row level security;
alter table public.time_off              enable row level security;
alter table public.appointments          enable row level security;

-- Helper: ¿el usuario autenticado es dueño de este centro?
create or replace function public.owns_center(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.centers c where c.id = cid and c.owner_id = auth.uid());
$$;

-- centers
create policy "centers: lectura pública"  on public.centers for select using (true);
create policy "centers: crear propio"     on public.centers for insert with check (owner_id = auth.uid());
create policy "centers: editar propio"    on public.centers for update using (owner_id = auth.uid());
create policy "centers: borrar propio"    on public.centers for delete using (owner_id = auth.uid());

-- services
create policy "services: lectura pública" on public.services for select using (active or public.owns_center(center_id));
create policy "services: dueño escribe"   on public.services for all
  using (public.owns_center(center_id)) with check (public.owns_center(center_id));

-- professionals
create policy "professionals: lectura pública" on public.professionals for select using (active or public.owns_center(center_id));
create policy "professionals: dueño escribe"   on public.professionals for all
  using (public.owns_center(center_id)) with check (public.owns_center(center_id));

-- professional_services
create policy "prof_services: lectura pública" on public.professional_services for select using (true);
create policy "prof_services: dueño escribe"   on public.professional_services for all
  using (exists (select 1 from public.professionals p where p.id = professional_id and public.owns_center(p.center_id)))
  with check (exists (select 1 from public.professionals p where p.id = professional_id and public.owns_center(p.center_id)));

-- working_hours
create policy "hours: lectura pública" on public.working_hours for select using (true);
create policy "hours: dueño escribe"   on public.working_hours for all
  using (exists (select 1 from public.professionals p where p.id = professional_id and public.owns_center(p.center_id)))
  with check (exists (select 1 from public.professionals p where p.id = professional_id and public.owns_center(p.center_id)));

-- time_off
create policy "time_off: lectura pública" on public.time_off for select using (true);
create policy "time_off: dueño escribe"   on public.time_off for all
  using (exists (select 1 from public.professionals p where p.id = professional_id and public.owns_center(p.center_id)))
  with check (exists (select 1 from public.professionals p where p.id = professional_id and public.owns_center(p.center_id)));

-- appointments: SÓLO el dueño del centro puede leer o modificar.
-- Los datos de clientes nunca son públicos.
create policy "appointments: dueño lee"      on public.appointments for select using (public.owns_center(center_id));
create policy "appointments: dueño escribe"  on public.appointments for all
  using (public.owns_center(center_id)) with check (public.owns_center(center_id));

-- =====================================================================
-- Disponibilidad pública sin exponer datos de clientes
-- Devuelve únicamente los rangos ocupados de un profesional.
-- =====================================================================
create or replace function public.busy_ranges(
  p_professional uuid, p_from timestamptz, p_to timestamptz
) returns table (starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.starts_at, a.ends_at
    from public.appointments a
   where a.professional_id = p_professional
     and a.status in ('pending', 'confirmed')
     and a.starts_at < p_to and a.ends_at > p_from
  union all
  select t.starts_at, t.ends_at
    from public.time_off t
   where t.professional_id = p_professional
     and t.starts_at < p_to and t.ends_at > p_from;
$$;

grant execute on function public.busy_ranges(uuid, timestamptz, timestamptz) to anon, authenticated;
