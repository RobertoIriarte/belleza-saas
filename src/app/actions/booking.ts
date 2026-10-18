'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { getAvailableSlots } from '@/lib/availability';
import { normalizePhone } from '@/lib/format';

const BookingSchema = z.object({
  centerSlug: z.string().min(3).max(40),
  serviceId: z.string().uuid(),
  professionalId: z.string().uuid().optional().or(z.literal('')),
  startsAt: z.string().datetime(),
  name: z.string().trim().min(2, 'Ingresa tu nombre').max(80),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((v) => v.replace(/\D/g, '').length >= 8, 'Ingresa un teléfono válido'),
  email: z.string().trim().email('Correo inválido').optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional(),
  website: z.string().max(0).optional(), // honeypot anti-spam
});

export type BookingState = { error?: string };

/**
 * Crea una reserva pública.
 * Se ejecuta con service role, por eso NO confía en el cliente: vuelve a calcular la
 * disponibilidad en el servidor y valida que el horario pedido exista realmente.
 * La restricción `no_double_booking` de la BD es la última barrera contra carreras.
 */
export async function createBooking(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const parsed = BookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }
  const d = parsed.data;
  if (d.website) return { error: 'No se pudo procesar la solicitud' };

  const db = createAdminClient();

  const { data: center } = await db
    .from('centers')
    .select('id, slug, timezone, slot_step_min, min_notice_min, max_days_ahead')
    .eq('slug', d.centerSlug)
    .single();
  if (!center) return { error: 'Centro no encontrado' };

  const { data: service } = await db
    .from('services')
    .select('id, duration_min')
    .eq('id', d.serviceId)
    .eq('center_id', center.id)
    .eq('active', true)
    .single();
  if (!service) return { error: 'Servicio no disponible' };

  // Fecha local del inicio solicitado, en la zona horaria del centro
  const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: center.timezone }).format(
    new Date(d.startsAt),
  );

  const slots = await getAvailableSlots(db, center, {
    serviceId: d.serviceId,
    date: localDate,
    professionalId: d.professionalId || undefined,
  });
  const wanted = new Date(d.startsAt).getTime();
  const slot = slots.find((s) => new Date(s.start).getTime() === wanted);
  if (!slot) {
    return { error: 'Ese horario ya no está disponible. Elige otro, por favor.' };
  }

  const { data: appt, error } = await db
    .from('appointments')
    .insert({
      center_id: center.id,
      professional_id: slot.professionalId,
      service_id: service.id,
      customer_name: d.name,
      customer_phone: d.phone,
      customer_email: d.email || null,
      notes: d.notes || null,
      starts_at: slot.start,
      ends_at: slot.end,
      status: 'confirmed',
      source: 'web',
    })
    .select('manage_token')
    .single();

  if (error) {
    // 23P01 = exclusion_violation: alguien tomó el horario en el mismo instante
    if (error.code === '23P01') {
      return { error: 'Ese horario acaba de ser tomado. Elige otro, por favor.' };
    }
    console.error('createBooking', error);
    return { error: 'No pudimos crear la reserva. Intenta nuevamente.' };
  }

  redirect(`/c/${center.slug}/cita/${appt.manage_token}`);
}

/** Cancela una cita usando el token secreto del enlace (sin necesidad de login). */
export async function cancelAppointment(formData: FormData) {
  const token = z.string().uuid().safeParse(formData.get('token'));
  const slug = String(formData.get('slug') ?? '');
  if (!token.success) return;

  const db = createAdminClient();
  await db
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('manage_token', token.data)
    .in('status', ['pending', 'confirmed'])
    .gt('starts_at', new Date().toISOString());

  redirect(`/c/${slug}/cita/${token.data}`);
}
