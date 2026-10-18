import { requireCenter } from '@/lib/admin';
import {
  createCategory,
  createService,
  deleteCategory,
  deleteService,
  moveCategory,
  renameCategory,
  setServiceCategory,
  toggleService,
} from '@/app/actions/admin';
import StatefulForm from '@/components/StatefulForm';
import ConfirmButton from '@/components/ConfirmButton';
import { fmtDuration } from '@/lib/format';
import { groupServices } from '@/lib/categories';
import { formatCLP, type Service, type ServiceCategory } from '@/lib/types';

export const metadata = { title: 'Servicios · Panel' };
export const dynamic = 'force-dynamic';

export default async function ServiciosPage() {
  const { supabase, center } = await requireCenter();
  const [{ data }, { data: catRows }] = await Promise.all([
    supabase
      .from('services')
      .select('*')
      .eq('center_id', center.id)
      .order('sort_order')
      .order('name'),
    // Si la migración 004 no se ha ejecutado, la consulta falla y no hay categorías
    supabase
      .from('service_categories')
      .select('*')
      .eq('center_id', center.id)
      .order('sort_order')
      .order('name'),
  ]);
  const services = (data ?? []) as Service[];
  const categories = (catRows ?? []) as ServiceCategory[];
  const groups = groupServices(services, categories, true);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h1 className="font-display text-3xl">Servicios</h1>
        {services.length === 0 && categories.length === 0 && (
          <p className="mt-4 text-[var(--muted)]">
            Crea tus categorías (por ejemplo Cabello, Barba, Uñas) y luego agrega los servicios.
          </p>
        )}

        <div className="mt-6 space-y-8">
          {groups.map((g, gi) => (
            <div key={g.id ?? 'otros'}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                {g.id ? (
                  <form action={renameCategory} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={g.id} />
                    <input
                      name="name"
                      defaultValue={g.name}
                      maxLength={60}
                      aria-label="Nombre de la categoría"
                      className="input !w-48 !py-1.5 font-semibold"
                    />
                    <button className="btn btn-ghost !px-3 !py-1.5 !text-xs">Renombrar</button>
                  </form>
                ) : (
                  <h2 className="text-sm font-semibold uppercase tracking-[.15em] text-[var(--muted)]">
                    {g.name}
                  </h2>
                )}

                {g.id && (
                  <div className="flex gap-2">
                    {gi > 0 && (
                      <form action={moveCategory}>
                        <input type="hidden" name="id" value={g.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button aria-label="Subir categoría" className="btn btn-ghost !px-3 !py-1.5 !text-xs">↑</button>
                      </form>
                    )}
                    {gi < categories.length - 1 && (
                      <form action={moveCategory}>
                        <input type="hidden" name="id" value={g.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button aria-label="Bajar categoría" className="btn btn-ghost !px-3 !py-1.5 !text-xs">↓</button>
                      </form>
                    )}
                    <form action={deleteCategory}>
                      <input type="hidden" name="id" value={g.id} />
                      <ConfirmButton
                        message="¿Eliminar la categoría? Sus servicios no se borran: quedarán sin categoría."
                        className="btn btn-ghost !px-3 !py-1.5 !text-xs !text-red-700"
                      >
                        Eliminar categoría
                      </ConfirmButton>
                    </form>
                  </div>
                )}
              </div>

              {g.services.length === 0 && (
                <p className="rounded-xl border border-dashed border-[var(--line)] px-4 py-3 text-sm text-[var(--muted)]">
                  Sin servicios todavía. Agrégalos con el formulario o muévelos desde otra categoría.
                </p>
              )}

              <ul className="space-y-3">
                {g.services.map((s) => (
                  <li key={s.id} className={`card p-4 ${s.active ? '' : 'opacity-55'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-sm text-[var(--muted)]">
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
                    </div>
                    {categories.length > 0 && (
                      <form action={setServiceCategory} className="mt-3 flex items-center gap-2">
                        <input type="hidden" name="id" value={s.id} />
                        <select
                          name="category_id"
                          defaultValue={s.category_id ?? ''}
                          aria-label="Categoría del servicio"
                          className="input !w-auto !py-1 text-sm"
                        >
                          <option value="">Sin categoría</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <button className="btn btn-ghost !px-3 !py-1 !text-xs">Mover</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <aside className="space-y-6">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Nueva categoría</h2>
          <StatefulForm action={createCategory} submitLabel="Agregar categoría">
            <div>
              <label className="label" htmlFor="cat-name">Nombre</label>
              <input id="cat-name" name="name" required maxLength={60} className="input" placeholder="Cabello, Barba, Uñas…" />
            </div>
          </StatefulForm>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Nuevo servicio</h2>
          <StatefulForm action={createService} submitLabel="Agregar servicio">
            <div>
              <label className="label" htmlFor="name">Nombre</label>
              <input id="name" name="name" required className="input" placeholder="Corte y peinado" />
            </div>
            <div>
              <label className="label" htmlFor="category_id">Categoría</label>
              <select id="category_id" name="category_id" className="input" defaultValue="">
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
