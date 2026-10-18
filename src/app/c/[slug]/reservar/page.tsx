import { accentVars } from '@/lib/style';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCenterBundle } from '@/lib/data';
import { todayIn } from '@/lib/availability';
import BookingFlow from './BookingFlow';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ servicio?: string }>;
};

export const metadata: Metadata = { title: 'Reservar hora' };
export const dynamic = 'force-dynamic';

export default async function ReservarPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { servicio } = await searchParams;
  const bundle = await getCenterBundle(slug);
  if (!bundle) notFound();
  const { center, services, professionals } = bundle;

  return (
    <div style={accentVars(center.accent_color)} className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href={`/c/${center.slug}`} className="font-display text-xl font-semibold">
            {center.name}
          </Link>
          <Link href={`/c/${center.slug}`} className="text-sm text-[var(--muted)] hover:underline">
            ← Volver
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-4xl">Reserva tu hora</h1>
        {services.length === 0 ? (
          <p className="mt-6 text-[var(--muted)]">Este centro aún no tiene servicios disponibles.</p>
        ) : (
          <BookingFlow
            center={{
              slug: center.slug,
              timezone: center.timezone,
              maxDaysAhead: center.max_days_ahead,
              today: todayIn(center.timezone),
            }}
            services={services}
            professionals={professionals}
            initialServiceId={servicio}
          />
        )}
      </main>
    </div>
  );
}
