import { accentVars } from '@/lib/style';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { cancelAppointment } from '@/app/actions/booking';
import { fmtDateTime, whatsappLink } from '@/lib/format';
import { STATUS_LABEL, formatCLP } from '@/lib/types';

type Props = { params: Promise<{ slug: string; token: string }> };

export const metadata: Metadata = { title: 'Tu cita', robots: { index: false } };
export const dynamic = 'force-dynamic';

/** Página de confirmación y gestión. El token UUID del enlace actúa como secreto. */
export default async function CitaPage({ params }: Props) {
  const { slug, token } = await params;
  if (!z.string().uuid().safeParse(token).success) notFound();

  const db = createAdminClient();
  const { data: a } = await db
    .from('appointments')
    .select(
      'id, starts_at, status, customer_name, services(name, price), professionals(name), centers!inner(slug, name, timezone, address, city, whatsapp, accent_color)',
    )
    .eq('manage_token', token)
    .single();

  // Nunca revelar citas de otro centro aunque el token exista
  const center = a && (Array.isArray(a.centers) ? a.centers[0] : a.centers);
  if (!a || !center || center.slug !== slug) notFound();
  const service = Array.isArray(a.services) ? a.services[0] : a.services;
  const pro = Array.isArray(a.professionals) ? a.professionals[0] : a.professionals;

  const active = a.status === 'confirmed' || a.status === 'pending';
  const future = new Date(a.starts_at) > new Date();
  const cancelled = a.status === 'cancelled';

  return (
    <main
      className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-12"
      style={accentVars(center.accent_color)}
    >
      <div className="card p-8">
        <div
          className={`mb-5 grid h-12 w-12 place-items-center rounded-full text-xl text-white ${
            cancelled ? 'bg-neutral-400' : 'bg-[var(--accent)]'
          }`}
        >
          {cancelled ? '×' : '✓'}
        </div>
        <h1 className="font-display text-3xl">
          {cancelled ? 'Cita cancelada' : `¡Listo, ${a.customer_name.split(' ')[0]}!`}
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          {cancelled ? 'Esta reserva fue cancelada.' : 'Tu hora quedó reservada.'}
        </p>

        <dl className="mt-6 space-y-3 border-t border-[var(--line)] pt-6 text-sm">
          <Row k="Servicio" v={service?.name ?? '—'} />
          <Row k="Profesional" v={pro?.name ?? '—'} />
          <Row k="Cuándo" v={fmtDateTime(a.starts_at, center.timezone)} />
          <Row k="Precio" v={service ? formatCLP(service.price) : '—'} />
          <Row k="Estado" v={STATUS_LABEL[a.status as keyof typeof STATUS_LABEL]} />
          {center.address && <Row k="Dónde" v={`${center.name} · ${center.address}${center.city ? `, ${center.city}` : ''}`} />}
        </dl>

        <div className="mt-8 flex flex-col gap-3">
          {active && future && (
            <form action={cancelAppointment}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="slug" value={slug} />
              <button type="submit" className="btn btn-ghost w-full">Cancelar esta cita</button>
            </form>
          )}
          {center.whatsapp && (
            <a
              className="btn btn-ghost w-full"
              target="_blank"
              rel="noreferrer"
              href={whatsappLink(center.whatsapp, `Hola, consulta por mi cita del ${fmtDateTime(a.starts_at, center.timezone)}`)}
            >
              Hablar con el centro
            </a>
          )}
          <Link href={`/c/${slug}`} className="btn btn-accent w-full">Volver al sitio</Link>
        </div>
        <p className="mt-6 text-xs text-[var(--muted)]">
          Guarda este enlace: es la forma de ver o cancelar tu cita.
        </p>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[var(--muted)]">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
