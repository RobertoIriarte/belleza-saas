import { addMinutes } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Center, Slot, WorkingHour } from './types';

type Range = { starts_at: string; ends_at: string };

/** "2026-10-20" -> 0..6 (domingo..sábado), sin depender de la zona horaria del servidor. */
export function weekdayOf(dateStr: string) {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

/** Fecha "hoy" (YYYY-MM-DD) en la zona horaria del centro. */
export function todayIn(tz: string, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now);
}

/** Convierte "09:30[:00]" de un día local a un instante UTC. */
function localToUtc(dateStr: string, time: string, tz: string) {
  return fromZonedTime(`${dateStr}T${time.slice(0, 5)}:00`, tz);
}

/**
 * Función pura: dados horarios, ocupación y reglas, devuelve los inicios posibles.
 * Un hueco es válido si [inicio, inicio+duración) cabe en un tramo laboral,
 * no choca con nada ocupado y respeta el aviso mínimo.
 */
export function computeSlots(opts: {
  date: string;
  timezone: string;
  durationMin: number;
  stepMin: number;
  minNoticeMin: number;
  hours: Pick<WorkingHour, 'weekday' | 'start_time' | 'end_time'>[];
  busy: Range[];
  now?: Date;
}) {
  const { date, timezone, durationMin, stepMin, minNoticeMin, hours, busy } = opts;
  const now = opts.now ?? new Date();
  const earliest = addMinutes(now, minNoticeMin);
  const weekday = weekdayOf(date);
  const busyMs = busy.map((b) => [
    new Date(b.starts_at).getTime(),
    new Date(b.ends_at).getTime(),
  ]);

  const out: { start: Date; end: Date }[] = [];

  for (const h of hours.filter((x) => x.weekday === weekday)) {
    const windowStart = localToUtc(date, h.start_time, timezone);
    const windowEnd = localToUtc(date, h.end_time, timezone);

    for (
      let start = windowStart;
      addMinutes(start, durationMin) <= windowEnd;
      start = addMinutes(start, stepMin)
    ) {
      const end = addMinutes(start, durationMin);
      if (start < earliest) continue;
      const s = start.getTime();
      const e = end.getTime();
      const clashes = busyMs.some(([bs, be]) => s < be && e > bs);
      if (!clashes) out.push({ start, end });
    }
  }
  return out;
}

/**
 * Obtiene los huecos libres de un día para un servicio.
 * - professionalId = undefined  ->  "cualquier profesional" (se deduplica por hora)
 * - Usa el cliente recibido: con sesión anónima basta, porque la ocupación se lee
 *   por la función `busy_ranges`, que no expone datos de clientes.
 */
export async function getAvailableSlots(
  supabase: SupabaseClient,
  center: Pick<
    Center,
    'id' | 'timezone' | 'slot_step_min' | 'min_notice_min' | 'max_days_ahead'
  >,
  params: { serviceId: string; date: string; professionalId?: string },
): Promise<Slot[]> {
  const { serviceId, date, professionalId } = params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const today = todayIn(center.timezone);
  if (date < today) return [];
  const maxMs = center.max_days_ahead * 86_400_000;
  if (new Date(`${date}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime() > maxMs)
    return [];

  const { data: service } = await supabase
    .from('services')
    .select('id, duration_min, center_id, active')
    .eq('id', serviceId)
    .eq('center_id', center.id)
    .eq('active', true)
    .single();
  if (!service) return [];

  // Profesionales activos que realizan este servicio
  let q = supabase
    .from('professional_services')
    .select('professional_id, professionals!inner(id, center_id, active, sort_order)')
    .eq('service_id', serviceId)
    .eq('professionals.center_id', center.id)
    .eq('professionals.active', true);
  if (professionalId) q = q.eq('professional_id', professionalId);
  const { data: links } = await q;

  const profIds: string[] = [...new Set((links ?? []).map((l: { professional_id: string }) => l.professional_id))];
  if (profIds.length === 0) return [];

  const { data: hours } = await supabase
    .from('working_hours')
    .select('professional_id, weekday, start_time, end_time')
    .in('professional_id', profIds)
    .eq('weekday', weekdayOf(date));

  // Ventana del día local, holgada, para traer ocupación
  const dayStart = localToUtc(date, '00:00', center.timezone);
  const dayEnd = addMinutes(dayStart, 24 * 60 + 60);

  const result: Slot[] = [];
  for (const pid of profIds) {
    const myHours = (hours ?? []).filter((h: { professional_id: string }) => h.professional_id === pid);
    if (myHours.length === 0) continue;

    const { data: busy } = await supabase.rpc('busy_ranges', {
      p_professional: pid,
      p_from: dayStart.toISOString(),
      p_to: dayEnd.toISOString(),
    });

    const slots = computeSlots({
      date,
      timezone: center.timezone,
      durationMin: service.duration_min,
      stepMin: center.slot_step_min,
      minNoticeMin: center.min_notice_min,
      hours: myHours,
      busy: (busy ?? []) as Range[],
    });

    for (const s of slots) {
      result.push({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
        professionalId: pid,
      });
    }
  }

  result.sort((a, b) => a.start.localeCompare(b.start));

  if (professionalId) return result;

  // "Cualquier profesional": una sola opción por hora de inicio
  const seen = new Set<string>();
  return result.filter((s) => (seen.has(s.start) ? false : (seen.add(s.start), true)));
}
