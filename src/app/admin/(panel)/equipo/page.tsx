import Link from 'next/link';
import { requireCenter } from '@/lib/admin';
import { createProfessional, toggleProfessional } from '@/app/actions/admin';
import StatefulForm from '@/components/StatefulForm';
import type { Professional } from '@/lib/types';

export const metadata = { title: 'Equipo · Panel' };
export const dynamic = 'force-dynamic';

export default async function EquipoPage() {
  const { supabase, center } = await requireCenter();
  const { data } = await supabase
    .from('professionals')
    .select('*')
    .eq('center_id', center.id)
    .order('sort_order')
    .order('name');
  const pros = (data ?? []) as Professional[];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h1 className="font-display text-3xl">Equipo</h1>
        {pros.length === 0 && (
          <p className="mt-4 text-[var(--muted)]">Agrega a tu primer profesional.</p>
        )}
        <ul className="mt-6 space-y-3">
          {pros.map((p) => (
            <li key={p.id} className={`card flex items-center justify-between gap-4 p-4 ${p.active ? '' : 'opacity-55'}`}>
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--accent)]/10 font-display text-xl text-[var(--accent)]">
                  {p.name.charAt(0)}
                </span>
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-[var(--muted)]">{p.role ?? 'Profesional'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/equipo/${p.id}`} className="btn btn-ghost !px-3 !py-1.5 !text-xs">
                  Servicios y horario
                </Link>
                <form action={toggleProfessional}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="active" value={String(p.active)} />
                  <button className="btn btn-ghost !px-3 !py-1.5 !text-xs">{p.active ? 'Desactivar' : 'Activar'}</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Nuevo profesional</h2>
          <StatefulForm action={createProfessional} submitLabel="Agregar y configurar">
            <div>
              <label className="label" htmlFor="name">Nombre</label>
              <input id="name" name="name" required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="role">Cargo</label>
              <input id="role" name="role" className="input" placeholder="Estilista, Manicurista…" />
            </div>
            <div>
              <label className="label" htmlFor="bio">Presentación</label>
              <textarea id="bio" name="bio" rows={2} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="photo_url">URL de foto (opcional)</label>
              <input id="photo_url" name="photo_url" type="url" className="input" placeholder="https://…" />
            </div>
          </StatefulForm>
        </div>
      </aside>
    </div>
  );
}
