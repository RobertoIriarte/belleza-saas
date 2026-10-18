import { requireCenter } from '@/lib/admin';
import { setAppointmentStatus } from '@/app/actions/admin';
import { fmtDateLong, fmtTime, whatsappLink } from '@/lib/format';
import { STATUS_LABEL, formatCLP, type AppointmentStatus } from '@/lib/types';

export const metadata = { title: 'Citas · Panel' };
export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  source: string;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
  services: { name: string; price: number } | null;
  professionals: { name: string } | null;
};

const BADGE: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-neutral-200 text-neutral-600',
  completed: 'bg-sky-100 text-sky-800',
  no_show: 'bg-red-100 text-red-700',
};

export default async function CitasPage() {
  const { supabase, center } = await requireCenter();

  // Desde el inicio de hoy (hora del centro) en adelante
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: center.timezone }).format(new Date());
  const from = new Date(`${todayStr}T00:00:00Z`);
  from.setUTCHours(from.getUTCHours() - 14); // margen por huso horario

  const { data } = await supabase
    .from('appointments')
    .select(
      'id, starts_at, ends_at, status, source, customer_name, customer_phone, notes, services(name, price), professionals(name)',
    )
    .eq('center_id', center.id)
    .gte('starts_at', from.toISOString())
    .order('starts_at')
    .limit(200);

  const rows = ((data ?? []) as unknown as Row[]).filter(
    (r) => new Date(r.ends_at) > new Date(Date.now() - 12 * 3600_000),
  );

  const byDay = new Map<string, Row[]>();
  for (const r of rows) {
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: center.timezone }).format(new Date(r.starts_at));
    byDay.set(key, [...(byDay.get(key) ?? []), r]);
  }

  const upcoming = rows.filter((r) => r.status === 'confirmed' || r.status === 'pending');
  const revenue = upcoming.reduce((n, r) => n + (r.services?.price ?? 0), 0);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Citas próximas" value={String(upcoming.length)} />
        <Stat label="Ingresos esperados" value={formatCLP(revenue)} />
        <Stat label="Por WhatsApp" value={String(upcoming.filter((r) => r.source === 'whatsapp').length)} />
      </div>

      <h1 className="font-display mt-10 text-3xl">Agenda</h1>
      {rows.length === 0 && (
        <p className="mt-4 text-[var(--muted)]">
          Aún no hay citas. Comparte tu sitio <code className="rounded bg-white px-1.5 py-0.5">/c/{center.slug}</code> para empezar a recibir reservas.
        </p>
      )}

      <div className="mt-6 space-y-8">
        {[...byDay.entries()].map(([day, list]) => (
          <section key={day}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">
              {fmtDateLong(list[0].starts_at, center.timezone)}
            </h2>
            <ul className="space-y-3">
              {list.map((r) => (
                <li key={r.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 text-center">
                      <p className="text-lg font-semibold">{fmtTime(r.starts_at, center.timezone)}</p>
                      <p className="text-xs text-[var(--muted)]">{fmtTime(r.ends_at, center.timezone)}</p>
                    </div>
                    <div>
                      <p className="font-semibold">
                        {r.customer_name}{' '}
                        <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${BADGE[r.status]}`}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        {r.services?.name} · {r.professionals?.name}
                        {r.source !== 'web' && ` · vía ${r.source}`}
                      </p>
                      {r.notes && <p className="mt-1 text-xs italic text-[var(--muted)]">“{r.notes}”</p>}
                      <a
                        href={whatsappLink(r.customer_phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        {r.customer_phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(['completed', 'no_show', 'cancelled'] as const)
                      .filter((s) => s !== r.status)
                      .map((s) => (
                        <form key={s} action={setAppointmentStatus}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="status" value={s} />
                          <button className="btn btn-ghost !px-3 !py-1.5 !text-xs">
                            {s === 'completed' ? 'Completar' : s === 'no_show' ? 'No asistió' : 'Cancelar'}
                          </button>
                        </form>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">{label}</p>
      <p className="font-display mt-2 text-3xl">{value}</p>
    </div>
  );
}
