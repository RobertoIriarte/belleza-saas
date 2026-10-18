import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailableSlots } from '@/lib/availability';

export const dynamic = 'force-dynamic';

/** GET /api/availability?center=slug&service=uuid&date=YYYY-MM-DD[&professional=uuid] */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const slug = sp.get('center');
  const serviceId = sp.get('service');
  const date = sp.get('date');
  const professionalId = sp.get('professional') || undefined;

  if (!slug || !serviceId || !date) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: center } = await supabase
    .from('centers')
    .select('id, timezone, slot_step_min, min_notice_min, max_days_ahead')
    .eq('slug', slug)
    .single();
  if (!center) return NextResponse.json({ error: 'Centro no encontrado' }, { status: 404 });

  const slots = await getAvailableSlots(supabase, center, { serviceId, date, professionalId });
  return NextResponse.json({ slots, timezone: center.timezone });
}
