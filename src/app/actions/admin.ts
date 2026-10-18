'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireCenter, requireUser } from '@/lib/admin';
import { CUSTOM_ID, PALETTES } from '@/lib/themes';

const str = (max = 200) => z.string().trim().max(max);
const optional = (max = 200) =>
  str(max).transform((v) => (v === '' ? null : v)).nullable().optional();

// ---------------------------------------------------------------- Centro

const CenterSchema = z.object({
  name: str(80).min(2, 'Ingresa el nombre del centro'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{3,40}$/, 'La URL debe tener 3-40 caracteres: letras, números y guiones'),
  tagline: optional(120),
  description: optional(600),
  phone: optional(30),
  whatsapp: optional(30),
  email: optional(120),
  address: optional(160),
  city: optional(80),
  instagram: optional(60),
});

export type FormState = { error?: string; ok?: boolean };

export async function createCenter(_p: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const parsed = CenterSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from('centers').insert({ ...parsed.data, owner_id: user.id });
  if (error) {
    return {
      error: error.code === '23505' ? 'Esa URL ya está en uso, elige otra.' : 'No se pudo crear el centro.',
    };
  }
  redirect('/admin');
}

export async function updateCenter(_p: FormState, fd: FormData): Promise<FormState> {
  const { supabase, center } = await requireCenter();
  const parsed = CenterSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const extra = z
    .object({
      slot_step_min: z.coerce.number().int().min(5).max(120),
      min_notice_min: z.coerce.number().int().min(0).max(10080),
      max_days_ahead: z.coerce.number().int().min(1).max(365),
      timezone: z.string().min(3).max(60),
    })
    .safeParse(Object.fromEntries(fd));
  if (!extra.success) return { error: 'Revisa los parámetros de agenda' };

  const { error } = await supabase
    .from('centers')
    .update({ ...parsed.data, ...extra.data })
    .eq('id', center.id);
  if (error) {
    return { error: error.code === '23505' ? 'Esa URL ya está en uso.' : 'No se pudo guardar.' };
  }
  revalidatePath('/admin', 'layout');
  revalidatePath(`/c/${parsed.data.slug}`);
  return { ok: true };
}

// ---------------------------------------------------------------- Colores

const ThemeSchema = z.object({
  palette: z.enum([...PALETTES.map((p) => p.id), CUSTOM_ID] as [string, ...string[]]),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export async function saveTheme(_p: FormState, fd: FormData): Promise<FormState> {
  const { supabase, center } = await requireCenter();
  const parsed = ThemeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: 'Elige una paleta válida' };

  // Con una paleta predefinida se conserva el color personalizado anterior para poder volver a él
  const update =
    parsed.data.palette === CUSTOM_ID
      ? { palette: parsed.data.palette, accent_color: parsed.data.accent_color }
      : { palette: parsed.data.palette };
  const { error } = await supabase.from('centers').update(update).eq('id', center.id);
  if (error) {
    return { error: 'No se pudo guardar. ¿Ejecutaste la migración 005_palette.sql en Supabase?' };
  }
  revalidatePath('/admin', 'layout');
  revalidatePath(`/c/${center.slug}`);
  return { ok: true };
}

// -------------------------------------------------------------- Servicios

const ServiceSchema = z.object({
  name: str(100).min(2, 'Ingresa el nombre'),
  category_id: z
    .string()
    .transform((v) => (v === '' ? null : v))
    .pipe(z.string().uuid().nullable())
    .optional(),
  description: optional(300),
  duration_min: z.coerce.number().int().min(5).max(600),
  price: z.coerce.number().int().min(0).max(100_000_000),
});

export async function createService(_p: FormState, fd: FormData): Promise<FormState> {
  const { supabase, center } = await requireCenter();
  const parsed = ServiceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from('services').insert({ ...parsed.data, center_id: center.id });
  if (error) return { error: 'No se pudo crear el servicio.' };
  revalidatePath('/admin/servicios');
  return { ok: true };
}

export async function setServiceCategory(fd: FormData) {
  const { supabase, center } = await requireCenter();
  const id = z.string().uuid().parse(fd.get('id'));
  const raw = String(fd.get('category_id') ?? '');
  const categoryId = raw === '' ? null : z.string().uuid().parse(raw);
  // La categoría debe ser de este mismo centro
  if (categoryId) {
    const { data } = await supabase
      .from('service_categories')
      .select('id')
      .eq('id', categoryId)
      .eq('center_id', center.id)
      .single();
    if (!data) return;
  }
  await supabase.from('services').update({ category_id: categoryId }).eq('id', id).eq('center_id', center.id);
  revalidatePath('/admin/servicios');
  revalidatePath(`/c/${center.slug}`);
}

export async function toggleService(fd: FormData) {
  const { supabase } = await requireCenter();
  const id = z.string().uuid().parse(fd.get('id'));
  const active = fd.get('active') === 'true';
  await supabase.from('services').update({ active: !active }).eq('id', id);
  revalidatePath('/admin/servicios');
}

export async function deleteService(fd: FormData) {
  const { supabase } = await requireCenter();
  const id = z.string().uuid().parse(fd.get('id'));
  // Si tiene citas históricas la FK lo impide: en ese caso se desactiva en vez de borrar.
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) await supabase.from('services').update({ active: false }).eq('id', id);
  revalidatePath('/admin/servicios');
}

// -------------------------------------------------------------- Categorías

const CategoryName = z.object({ name: str(60).min(1, 'Ingresa el nombre de la categoría') });

export async function createCategory(_p: FormState, fd: FormData): Promise<FormState> {
  const { supabase, center } = await requireCenter();
  const parsed = CategoryName.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: last } = await supabase
    .from('service_categories')
    .select('sort_order')
    .eq('center_id', center.id)
    .order('sort_order', { ascending: false })
    .limit(1);
  const next = ((last?.[0]?.sort_order as number | undefined) ?? -1) + 1;

  const { error } = await supabase
    .from('service_categories')
    .insert({ center_id: center.id, name: parsed.data.name, sort_order: next });
  if (error) {
    return {
      error:
        error.code === '23505'
          ? 'Ya tienes una categoría con ese nombre.'
          : 'No se pudo crear. ¿Ejecutaste la migración 004_categories.sql en Supabase?',
    };
  }
  revalidatePath('/admin/servicios');
  revalidatePath(`/c/${center.slug}`);
  return { ok: true };
}

export async function renameCategory(fd: FormData) {
  const { supabase, center } = await requireCenter();
  const id = z.string().uuid().parse(fd.get('id'));
  const parsed = CategoryName.safeParse({ name: fd.get('name') ?? '' });
  if (!parsed.success) return;
  await supabase
    .from('service_categories')
    .update({ name: parsed.data.name })
    .eq('id', id)
    .eq('center_id', center.id);
  revalidatePath('/admin/servicios');
  revalidatePath(`/c/${center.slug}`);
}

export async function moveCategory(fd: FormData) {
  const { supabase, center } = await requireCenter();
  const id = z.string().uuid().parse(fd.get('id'));
  const step = fd.get('dir') === 'up' ? -1 : 1;

  const { data } = await supabase
    .from('service_categories')
    .select('id')
    .eq('center_id', center.id)
    .order('sort_order')
    .order('name');
  const ids = (data ?? []).map((r: { id: string }) => r.id);
  const from = ids.indexOf(id);
  const to = from + step;
  if (from < 0 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];

  await Promise.all(
    ids.map((cid: string, i: number) =>
      supabase.from('service_categories').update({ sort_order: i }).eq('id', cid).eq('center_id', center.id),
    ),
  );
  revalidatePath('/admin/servicios');
  revalidatePath(`/c/${center.slug}`);
}

/** Borra la categoría; sus servicios no se borran, quedan sin categoría. */
export async function deleteCategory(fd: FormData) {
  const { supabase, center } = await requireCenter();
  const id = z.string().uuid().parse(fd.get('id'));
  await supabase.from('service_categories').delete().eq('id', id).eq('center_id', center.id);
  revalidatePath('/admin/servicios');
  revalidatePath(`/c/${center.slug}`);
}

// ------------------------------------------------------------ Profesionales

const ProSchema = z.object({
  name: str(80).min(2, 'Ingresa el nombre'),
  role: optional(80),
  bio: optional(300),
  photo_url: optional(500),
});

export async function createProfessional(_p: FormState, fd: FormData): Promise<FormState> {
  const { supabase, center } = await requireCenter();
  const parsed = ProSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from('professionals')
    .insert({ ...parsed.data, center_id: center.id })
    .select('id')
    .single();
  if (error || !data) return { error: 'No se pudo crear al profesional.' };

  // Horario por defecto: lunes a viernes 09:00-18:00 (editable luego)
  await supabase.from('working_hours').insert(
    [1, 2, 3, 4, 5].map((weekday) => ({
      professional_id: data.id,
      weekday,
      start_time: '09:00',
      end_time: '18:00',
    })),
  );
  redirect(`/admin/equipo/${data.id}`);
}

export async function updateProfessional(_p: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireCenter();
  const id = z.string().uuid().parse(fd.get('id'));
  const parsed = ProSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from('professionals').update(parsed.data).eq('id', id);
  if (error) return { error: 'No se pudo guardar.' };
  revalidatePath('/admin/equipo');
  return { ok: true };
}

export async function toggleProfessional(fd: FormData) {
  const { supabase } = await requireCenter();
  const id = z.string().uuid().parse(fd.get('id'));
  const active = fd.get('active') === 'true';
  await supabase.from('professionals').update({ active: !active }).eq('id', id);
  revalidatePath('/admin/equipo');
}

export async function saveProfessionalServices(fd: FormData) {
  const { supabase } = await requireCenter();
  const id = z.string().uuid().parse(fd.get('id'));
  const serviceIds = fd.getAll('service').map((v) => z.string().uuid().parse(v));

  await supabase.from('professional_services').delete().eq('professional_id', id);
  if (serviceIds.length) {
    await supabase
      .from('professional_services')
      .insert(serviceIds.map((service_id) => ({ professional_id: id, service_id })));
  }
  revalidatePath(`/admin/equipo/${id}`);
}

const Hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** Cada día admite hasta dos tramos (ej. 09-13 y 15-19). */
export async function saveWorkingHours(fd: FormData) {
  const { supabase } = await requireCenter();
  const id = z.string().uuid().parse(fd.get('id'));

  const rows: { professional_id: string; weekday: number; start_time: string; end_time: string }[] = [];
  for (let d = 0; d < 7; d++) {
    if (fd.get(`on-${d}`) !== 'on') continue;
    for (const n of ['', '2']) {
      const s = Hhmm.safeParse(fd.get(`start${n}-${d}`));
      const e = Hhmm.safeParse(fd.get(`end${n}-${d}`));
      if (s.success && e.success && e.data > s.data) {
        rows.push({ professional_id: id, weekday: d, start_time: s.data, end_time: e.data });
      }
    }
  }

  await supabase.from('working_hours').delete().eq('professional_id', id);
  if (rows.length) await supabase.from('working_hours').insert(rows);
  revalidatePath(`/admin/equipo/${id}`);
}

// ------------------------------------------------------------------ Citas

const Status = z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']);

export async function setAppointmentStatus(fd: FormData) {
  const { supabase } = await requireCenter();
  const id = z.string().uuid().parse(fd.get('id'));
  const status = Status.parse(fd.get('status'));
  await supabase.from('appointments').update({ status }).eq('id', id);
  revalidatePath('/admin');
}
