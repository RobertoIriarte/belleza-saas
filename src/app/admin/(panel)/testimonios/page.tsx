import { requireCenter } from '@/lib/admin';
import { createTestimonial, deleteTestimonial, toggleTestimonial } from '@/app/actions/admin';
import StatefulForm from '@/components/StatefulForm';
import SubmitButton from '@/components/SubmitButton';
import ConfirmButton from '@/components/ConfirmButton';
import Stars from '@/components/Stars';
import { TESTIMONIALS_MAX, type Testimonial } from '@/lib/types';

export const metadata = { title: 'Testimonios · Panel' };
export const dynamic = 'force-dynamic';

export default async function TestimoniosPage() {
  const { supabase, center } = await requireCenter();
  const { data } = await supabase
    .from('testimonials')
    .select('*')
    .eq('center_id', center.id)
    .order('created_at', { ascending: false });
  const items = (data ?? []) as Testimonial[];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h1 className="font-display text-3xl">Testimonios</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Opiniones de tus clientes que se muestran al final de tu sitio. En el sitio aparecen los{' '}
          {TESTIMONIALS_MAX} más recientes que estén visibles. Publica solo opiniones reales.
        </p>

        {items.length === 0 && (
          <p className="mt-6 text-[var(--muted)]">Aún no hay testimonios. Agrega el primero con el formulario.</p>
        )}

        <ul className="mt-6 space-y-3">
          {items.map((t) => (
            <li key={t.id} className={`card p-4 ${t.active ? '' : 'opacity-55'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Stars value={t.rating} size={16} />
                  <p className="mt-2 text-sm leading-relaxed">“{t.body}”</p>
                  <p className="mt-2 text-sm font-semibold">{t.author_name}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={toggleTestimonial}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="active" value={String(t.active)} />
                    <SubmitButton className="btn btn-ghost !px-3 !py-1.5 !text-xs">{t.active ? 'Ocultar' : 'Mostrar'}</SubmitButton>
                  </form>
                  <form action={deleteTestimonial}>
                    <input type="hidden" name="id" value={t.id} />
                    <ConfirmButton
                      message="¿Eliminar este testimonio?"
                      className="btn btn-ghost !px-3 !py-1.5 !text-xs !text-red-700"
                    >
                      Eliminar
                    </ConfirmButton>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Nuevo testimonio</h2>
          <StatefulForm action={createTestimonial} submitLabel="Agregar testimonio">
            <div>
              <label className="label" htmlFor="author_name">Nombre del cliente</label>
              <input id="author_name" name="author_name" required maxLength={80} className="input" placeholder="María P." />
            </div>
            <div>
              <label className="label" htmlFor="rating">Calificación</label>
              <select id="rating" name="rating" defaultValue="5" className="input">
                <option value="5">★★★★★ · 5 estrellas</option>
                <option value="4">★★★★☆ · 4 estrellas</option>
                <option value="3">★★★☆☆ · 3 estrellas</option>
                <option value="2">★★☆☆☆ · 2 estrellas</option>
                <option value="1">★☆☆☆☆ · 1 estrella</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="body">Testimonio</label>
              <textarea id="body" name="body" required rows={4} maxLength={500} className="input" placeholder="Lo que dijo tu cliente…" />
            </div>
          </StatefulForm>
        </div>
      </aside>
    </div>
  );
}
