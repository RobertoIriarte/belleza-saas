import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireCenter } from '@/lib/admin';
import { saveProfessionalServices, saveWorkingHours, updateProfessional } from '@/app/actions/admin';
import StatefulForm from '@/components/StatefulForm';
import { WEEKDAYS, type Professional, type Service, type WorkingHour } from '@/lib/types';

export const metadata = { title: 'Profesional · Panel' };
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

// Orden de visualización: lunes a domingo
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function ProfesionalPage({ params }: Props) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const { supabase, center } = await requireCenter();
  const { data: pro } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', id)
    .eq('center_id', center.id)
    .single();
  if (!pro) notFound();
  const p = pro as Professional;

  const [{ data: services }, { data: links }, { data: hours }] = await Promise.all([
    supabase.from('services').select('*').eq('center_id', center.id).order('name'),
    supabase.from('professional_services').select('service_id').eq('professional_id', id),
    supabase.from('working_hours').select('*').eq('professional_id', id).order('start_time'),
  ]);

  const mine = new Set((links ?? []).map((l) => l.service_id as string));
  const hrs = (hours ?? []) as WorkingHour[];

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/equipo" className="text-sm text-[var(--muted)] hover:underline">← Equipo</Link>
        <h1 className="font-display mt-2 text-3xl">{p.name}</h1>
      </div>

      {/* Datos */}
      <section className="card p-5">
        <h2 className="mb-4 font-semibold">Perfil</h2>
        <StatefulForm action={updateProfessional}>
          <input type="hidden" name="id" value={p.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">Nombre</label>
              <input id="name" name="name" defaultValue={p.name} required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="role">Cargo</label>
              <input id="role" name="role" defaultValue={p.role ?? ''} className="input" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="bio">Presentación</label>
            <textarea id="bio" name="bio" rows={2} defaultValue={p.bio ?? ''} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="photo_url">URL de foto</label>
            <input id="photo_url" name="photo_url" defaultValue={p.photo_url ?? ''} className="input" />
          </div>
        </StatefulForm>
      </section>

      {/* Servicios que realiza */}
      <section className="card p-5">
        <h2 className="mb-1 font-semibold">Servicios que realiza</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Sólo podrá ser reservado para los servicios marcados.
        </p>
        {(services ?? []).length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Primero crea servicios en la pestaña <Link href="/admin/servicios" className="text-[var(--accent)] underline">Servicios</Link>.
          </p>
        ) : (
          <form action={saveProfessionalServices} className="space-y-3">
            <input type="hidden" name="id" value={p.id} />
            <div className="grid gap-2 sm:grid-cols-2">
              {(services as Service[]).map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm">
                  <input type="checkbox" name="service" value={s.id} defaultChecked={mine.has(s.id)} className="h-4 w-4 accent-[var(--accent)]" />
                  {s.name}
                </label>
              ))}
            </div>
            <button className="btn btn-accent">Guardar servicios</button>
          </form>
        )}
      </section>

      {/* Horario */}
      <section className="card p-5">
        <h2 className="mb-1 font-semibold">Horario semanal</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Usa el segundo tramo para pausas (ej. 09:00–13:00 y 15:00–19:00). Horas en {center.timezone}.
        </p>
        <form action={saveWorkingHours} className="space-y-2">
          <input type="hidden" name="id" value={p.id} />
          {ORDER.map((d) => {
            const day = hrs.filter((h) => h.weekday === d);
            const a = day[0];
            const b = day[1];
            return (
              <div key={d} className="grid grid-cols-[110px_1fr] items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3 sm:grid-cols-[130px_1fr_1fr]">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" name={`on-${d}`} defaultChecked={day.length > 0} className="h-4 w-4 accent-[var(--accent)]" />
                  {WEEKDAYS[d]}
                </label>
                <div className="flex items-center gap-2">
                  <input type="time" name={`start-${d}`} defaultValue={a?.start_time.slice(0, 5) ?? '09:00'} className="input !py-1.5" />
                  <span className="text-[var(--muted)]">–</span>
                  <input type="time" name={`end-${d}`} defaultValue={a?.end_time.slice(0, 5) ?? '18:00'} className="input !py-1.5" />
                </div>
                <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                  <input type="time" name={`start2-${d}`} defaultValue={b?.start_time.slice(0, 5) ?? ''} className="input !py-1.5" />
                  <span className="text-[var(--muted)]">–</span>
                  <input type="time" name={`end2-${d}`} defaultValue={b?.end_time.slice(0, 5) ?? ''} className="input !py-1.5" />
                </div>
              </div>
            );
          })}
          <div className="pt-2">
            <button className="btn btn-accent">Guardar horario</button>
          </div>
        </form>
      </section>
    </div>
  );
}
