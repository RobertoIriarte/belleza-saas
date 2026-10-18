import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/admin';
import { createCenter } from '@/app/actions/admin';
import StatefulForm from '@/components/StatefulForm';
import CenterFields from '@/components/CenterFields';

export const metadata = { title: 'Crear tu centro' };

export default async function NuevoCentro() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from('centers').select('id').eq('owner_id', user.id).limit(1);
  if (data && data.length > 0) redirect('/admin');

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-display text-4xl">Crea tu centro</h1>
      <p className="mt-2 text-[var(--muted)]">
        Estos datos aparecerán en tu sitio público. Podrás cambiarlos cuando quieras.
      </p>
      <div className="card mt-8 p-6">
        <StatefulForm action={createCenter} submitLabel="Crear centro">
          <CenterFields />
        </StatefulForm>
      </div>
    </main>
  );
}
