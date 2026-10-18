import { requireCenter } from '@/lib/admin';
import { createService, deleteService, toggleService } from '@/app/actions/admin';
import StatefulForm from '@/components/StatefulForm';
import { fmtDuration } from '@/lib/format';
import { formatCLP, type Service } from '@/lib/types';

export const metadata = { title: 'Servicios · Panel' };
export const dynamic = 'force-dynamic';

export default async function ServiciosPage() {
  const { supabase, center } = await requireCenter();
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('center_id', center.id)
    .order('sort_order')
    .order('name');
  const services = (data ?? []) as Service[];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h1 className="font-display text-3xl">Servicios</h1>
        {services.length === 0 && (
          <p className="mt-4 text-[var(--muted)]">Agrega tu primer servicio con el formulario.</p>
        )}
        <ul className="mt-6 space-y-3">
          {services.map((s) => (
            <li key={s.id} className={`card flex items-center justify-between gap-4 p-4 ${s.active ? '' : 'opacity-55'}`}>
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {s.category ? `${s.category} · ` : ''}
                  {fmtDuration(s.duration_min)} · {formatCLP(s.price)}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={toggleService}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="active" value={String(s.active)} />
                  <button className="btn btn-ghost !px-3 !py-1.5 !text-xs">{s.active ? 'Ocultar' : 'Mostrar'}</button>
                </form>
                <form action={deleteService}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="btn btn-ghost !px-3 !py-1.5 !text-xs !text-red-700">Eliminar</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Nuevo servicio</h2>
          <StatefulForm action={createService} submitLabel="Agregar servicio">
            <div>
              <label className="label" htmlFor="name">Nombre</label>
              <input id="name" name="name" required className="input" placeholder="Corte y peinado" />
            </div>
            <div>
              <label className="label" htmlFor="category">Categoría</label>
              <input id="category" name="category" className="input" placeholder="Cabello, Uñas, Facial…" />
            </div>
            <div>
              <label className="label" htmlFor="description">Descripción</label>
              <textarea id="description" name="description" rows={2} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="duration_min">Duración (min)</label>
                <input id="duration_min" name="duration_min" type="number" min={5} step={5} defaultValue={60} required className="input" />
              </div>
              <div>
                <label className="label" htmlFor="price">Precio (CLP)</label>
                <input id="price" name="price" type="number" min={0} step={500} defaultValue={0} required className="input" />
              </div>
            </div>
          </StatefulForm>
        </div>
      </aside>
    </div>
  );
}
