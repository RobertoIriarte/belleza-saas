'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { createBooking, type BookingState } from '@/app/actions/booking';
import type { Professional, Service, Slot } from '@/lib/types';
import { formatCLP } from '@/lib/types';
import { fmtDateLong, fmtDuration, fmtTime } from '@/lib/format';

type Pro = Professional & { serviceIds: string[] };
type Props = {
  center: { slug: string; timezone: string; maxDaysAhead: number; today: string };
  services: Service[];
  professionals: Pro[];
  initialServiceId?: string;
};

const ANY = 'any';

function addDays(dateStr: string, n: number) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function dayChip(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return {
    dow: new Intl.DateTimeFormat('es-CL', { weekday: 'short', timeZone: 'UTC' }).format(d),
    num: d.getUTCDate(),
    mon: new Intl.DateTimeFormat('es-CL', { month: 'short', timeZone: 'UTC' }).format(d),
  };
}

export default function BookingFlow({ center, services, professionals, initialServiceId }: Props) {
  const [serviceId, setServiceId] = useState<string | null>(
    services.some((s) => s.id === initialServiceId) ? (initialServiceId as string) : null,
  );
  const [proId, setProId] = useState<string>(ANY);
  const [date, setDate] = useState<string>(center.today);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);

  const [state, action, pending] = useActionState<BookingState, FormData>(createBooking, {});

  const service = services.find((s) => s.id === serviceId) ?? null;
  const eligiblePros = useMemo(
    () => professionals.filter((p) => serviceId && p.serviceIds.includes(serviceId)),
    [professionals, serviceId],
  );

  const days = useMemo(
    () => Array.from({ length: Math.min(center.maxDaysAhead, 21) }, (_, i) => addDays(center.today, i)),
    [center.today, center.maxDaysAhead],
  );

  // Cargar disponibilidad al cambiar servicio / profesional / día
  useEffect(() => {
    if (!serviceId) return;
    const ctrl = new AbortController();
    setLoading(true);
    setSlot(null);
    const qs = new URLSearchParams({ center: center.slug, service: serviceId, date });
    if (proId !== ANY) qs.set('professional', proId);
    fetch(`/api/availability?${qs}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => setSlots(j.slots ?? []))
      .catch((e) => e.name !== 'AbortError' && setSlots([]))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [serviceId, proId, date, center.slug]);

  const grouped = useMemo(() => {
    const g: Record<'Mañana' | 'Tarde' | 'Noche', Slot[]> = { Mañana: [], Tarde: [], Noche: [] };
    for (const s of slots ?? []) {
      const h = Number(fmtTime(s.start, center.timezone).slice(0, 2));
      (h < 12 ? g.Mañana : h < 19 ? g.Tarde : g.Noche).push(s);
    }
    return g;
  }, [slots, center.timezone]);

  const proName = (id: string) => professionals.find((p) => p.id === id)?.name;

  return (
    <div className="mt-8 space-y-10">
      {/* 1 · Servicio */}
      <section>
        <StepTitle n={1} title="Elige el servicio" />
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setServiceId(s.id);
                setProId(ANY);
              }}
              className={`card p-4 text-left transition ${
                serviceId === s.id ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20' : 'hover:border-[var(--accent)]/50'
              }`}
            >
              <span className="block font-semibold">{s.name}</span>
              <span className="mt-1 block text-sm text-[var(--muted)]">
                {fmtDuration(s.duration_min)} · {formatCLP(s.price)}
              </span>
            </button>
          ))}
        </div>
      </section>

      {service && (
        <>
          {/* 2 · Profesional */}
          <section>
            <StepTitle n={2} title="¿Con quién?" />
            {eligiblePros.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Por ahora no hay profesionales asignados a este servicio.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Chip active={proId === ANY} onClick={() => setProId(ANY)}>Cualquiera</Chip>
                {eligiblePros.map((p) => (
                  <Chip key={p.id} active={proId === p.id} onClick={() => setProId(p.id)}>
                    {p.name}
                  </Chip>
                ))}
              </div>
            )}
          </section>

          {/* 3 · Fecha y hora */}
          {eligiblePros.length > 0 && (
            <section>
              <StepTitle n={3} title="Fecha y hora" />
              <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
                {days.map((d) => {
                  const c = dayChip(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDate(d)}
                      className={`flex w-16 shrink-0 flex-col items-center rounded-2xl border px-2 py-3 text-sm transition ${
                        date === d
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                          : 'border-[var(--line)] bg-white hover:border-[var(--accent)]/50'
                      }`}
                    >
                      <span className="text-xs uppercase opacity-70">{c.dow}</span>
                      <span className="text-xl font-semibold">{c.num}</span>
                      <span className="text-xs opacity-70">{c.mon}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 min-h-24">
                {loading && <p className="text-sm text-[var(--muted)]">Buscando horarios…</p>}
                {!loading && slots && slots.length === 0 && (
                  <p className="text-sm text-[var(--muted)]">
                    No hay horarios libres este día. Prueba con otra fecha.
                  </p>
                )}
                {!loading &&
                  (Object.keys(grouped) as (keyof typeof grouped)[]).map(
                    (k) =>
                      grouped[k].length > 0 && (
                        <div key={k} className="mb-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">{k}</p>
                          <div className="flex flex-wrap gap-2">
                            {grouped[k].map((s) => (
                              <Chip
                                key={`${s.start}-${s.professionalId}`}
                                active={slot?.start === s.start}
                                onClick={() => setSlot(s)}
                              >
                                {fmtTime(s.start, center.timezone)}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      ),
                  )}
              </div>
            </section>
          )}
        </>
      )}

      {/* 4 · Tus datos */}
      {service && slot && (
        <section>
          <StepTitle n={4} title="Tus datos" />
          <div className="card mb-5 p-4 text-sm">
            <p className="font-semibold">{service.name}</p>
            <p className="text-[var(--muted)]">
              {fmtDateLong(slot.start, center.timezone)} · {fmtTime(slot.start, center.timezone)} hrs
              {proName(slot.professionalId) ? ` · con ${proName(slot.professionalId)}` : ''}
            </p>
          </div>

          <form action={action} className="space-y-4">
            <input type="hidden" name="centerSlug" value={center.slug} />
            <input type="hidden" name="serviceId" value={service.id} />
            <input type="hidden" name="professionalId" value={proId === ANY ? '' : proId} />
            <input type="hidden" name="startsAt" value={slot.start} />
            {/* honeypot: los bots lo rellenan, las personas no lo ven */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">Nombre</label>
                <input id="name" name="name" required className="input" autoComplete="name" />
              </div>
              <div>
                <label className="label" htmlFor="phone">WhatsApp / teléfono</label>
                <input id="phone" name="phone" required className="input" inputMode="tel" autoComplete="tel" placeholder="+56 9 1234 5678" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="email">Correo (opcional)</label>
              <input id="email" name="email" type="email" className="input" autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="notes">Comentarios (opcional)</label>
              <textarea id="notes" name="notes" rows={2} className="input" />
            </div>

            {state.error && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-accent w-full disabled:opacity-60">
              {pending ? 'Reservando…' : 'Confirmar reserva'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent)] text-sm text-white">{n}</span>
      {title}
    </h2>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
          : 'border-[var(--line)] bg-white hover:border-[var(--accent)]/50'
      }`}
    >
      {children}
    </button>
  );
}
