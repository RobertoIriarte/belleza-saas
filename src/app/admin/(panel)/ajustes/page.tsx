import { requireCenter } from '@/lib/admin';
import { updateCenter } from '@/app/actions/admin';
import StatefulForm from '@/components/StatefulForm';
import CenterFields from '@/components/CenterFields';

export const metadata = { title: 'Ajustes · Panel' };
export const dynamic = 'force-dynamic';

export default async function AjustesPage() {
  const { center } = await requireCenter();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Ajustes del centro</h1>
      <div className="card mt-6 p-6">
        <StatefulForm action={updateCenter}>
          <CenterFields v={center} />

          <hr className="border-[var(--line)]" />
          <h2 className="font-semibold">Reglas de agenda</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="slot_step_min">Intervalo entre horas (min)</label>
              <input id="slot_step_min" name="slot_step_min" type="number" min={5} max={120} step={5} defaultValue={center.slot_step_min} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="min_notice_min">Aviso mínimo (min)</label>
              <input id="min_notice_min" name="min_notice_min" type="number" min={0} step={15} defaultValue={center.min_notice_min} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="max_days_ahead">Reservas hasta (días)</label>
              <input id="max_days_ahead" name="max_days_ahead" type="number" min={1} max={365} defaultValue={center.max_days_ahead} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="timezone">Zona horaria</label>
              <input id="timezone" name="timezone" defaultValue={center.timezone} className="input" />
            </div>
          </div>
        </StatefulForm>
      </div>
    </div>
  );
}
