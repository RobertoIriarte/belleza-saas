import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCenterBundle } from '@/lib/data';
import { formatCLP } from '@/lib/types';
import { fmtDuration, whatsappLink } from '@/lib/format';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const b = await getCenterBundle(slug);
  if (!b) return { title: 'Centro no encontrado' };
  return {
    title: `${b.center.name} · Reserva tu hora`,
    description: b.center.tagline ?? b.center.description ?? undefined,
  };
}

export default async function CenterLanding({ params }: Props) {
  const { slug } = await params;
  const bundle = await getCenterBundle(slug);
  if (!bundle) notFound();
  const { center, services, professionals } = bundle;

  const categories = [...new Set(services.map((s) => s.category ?? 'Servicios'))];
  const reservar = `/c/${center.slug}/reservar`;

  return (
    <div style={{ ['--accent' as string]: center.accent_color }}>
      {/* Navegación */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <span className="font-display text-xl font-semibold">{center.name}</span>
          <nav className="hidden items-center gap-6 text-sm sm:flex">
            <a href="#servicios" className="hover:text-[var(--accent)]">Servicios</a>
            <a href="#equipo" className="hover:text-[var(--accent)]">Equipo</a>
            <a href="#contacto" className="hover:text-[var(--accent)]">Contacto</a>
          </nav>
          <Link href={reservar} className="btn btn-accent !py-2">Reservar</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
        <div className="flex flex-col justify-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[.2em] text-[var(--accent)]">
            {center.city ?? 'Centro de belleza'}
          </p>
          <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl">
            {center.tagline ?? 'Tu momento de cuidarte'}
          </h1>
          {center.description && (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
              {center.description}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={reservar} className="btn btn-accent">Agendar mi hora</Link>
            {center.whatsapp && (
              <a
                href={whatsappLink(center.whatsapp, 'Hola, quisiera reservar una hora')}
                className="btn btn-ghost"
                target="_blank"
                rel="noreferrer"
              >
                Escribir por WhatsApp
              </a>
            )}
          </div>
        </div>
        <div
          aria-hidden
          className="relative hidden aspect-[4/5] overflow-hidden rounded-[2rem] md:block"
          style={{
            background: `radial-gradient(120% 90% at 20% 10%, color-mix(in srgb, var(--accent) 30%, white), #fdf2f8 55%, #fff7ed)`,
          }}
        >
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-display text-[9rem] leading-none text-[var(--accent)]/25">
              {center.name.charAt(0)}
            </span>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="border-y border-[var(--line)] bg-white/60 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-4xl">Servicios</h2>
          <p className="mt-2 text-[var(--muted)]">Elige lo que necesitas y reserva en menos de un minuto.</p>

          {services.length === 0 && (
            <p className="mt-8 text-[var(--muted)]">Pronto publicaremos nuestros servicios.</p>
          )}

          <div className="mt-10 space-y-10">
            {categories.map((cat) => (
              <div key={cat}>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[.15em] text-[var(--accent)]">
                  {cat}
                </h3>
                <ul className="grid gap-4 md:grid-cols-2">
                  {services
                    .filter((s) => (s.category ?? 'Servicios') === cat)
                    .map((s) => (
                      <li key={s.id} className="card flex items-start justify-between gap-4 p-5">
                        <div>
                          <p className="font-semibold">{s.name}</p>
                          {s.description && (
                            <p className="mt-1 text-sm text-[var(--muted)]">{s.description}</p>
                          )}
                          <p className="mt-2 text-xs text-[var(--muted)]">{fmtDuration(s.duration_min)}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-3">
                          <span className="font-semibold">{formatCLP(s.price)}</span>
                          <Link
                            href={`${reservar}?servicio=${s.id}`}
                            className="text-sm font-semibold text-[var(--accent)] hover:underline"
                          >
                            Reservar →
                          </Link>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo */}
      {professionals.length > 0 && (
        <section id="equipo" className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-4xl">Nuestro equipo</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {professionals.map((p) => (
              <article key={p.id} className="card overflow-hidden">
                <div className="relative aspect-[4/5] bg-gradient-to-br from-rose-100 to-amber-50">
                  {p.photo_url ? (
                    <Image src={p.photo_url} alt={p.name} fill className="object-cover" sizes="300px" />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center font-display text-7xl text-[var(--accent)]/40">
                      {p.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.role && <p className="text-sm text-[var(--accent)]">{p.role}</p>}
                  {p.bio && <p className="mt-2 text-sm text-[var(--muted)]">{p.bio}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Contacto */}
      <section id="contacto" className="bg-[var(--ink)] py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl">Visítanos</h2>
            <dl className="mt-6 space-y-3 text-white/80">
              {center.address && (
                <div><dt className="text-xs uppercase tracking-widest text-white/50">Dirección</dt><dd>{center.address}{center.city ? `, ${center.city}` : ''}</dd></div>
              )}
              {center.phone && (
                <div><dt className="text-xs uppercase tracking-widest text-white/50">Teléfono</dt><dd><a href={`tel:${center.phone}`}>{center.phone}</a></dd></div>
              )}
              {center.email && (
                <div><dt className="text-xs uppercase tracking-widest text-white/50">Correo</dt><dd><a href={`mailto:${center.email}`}>{center.email}</a></dd></div>
              )}
              {center.instagram && (
                <div><dt className="text-xs uppercase tracking-widest text-white/50">Instagram</dt><dd>@{center.instagram.replace('@', '')}</dd></div>
              )}
            </dl>
          </div>
          <div className="flex flex-col items-start justify-center gap-4">
            <p className="font-display text-3xl">¿Lista para tu próxima cita?</p>
            <Link href={reservar} className="btn btn-accent">Reservar ahora</Link>
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-6xl px-5 text-xs text-white/40">
          © {new Date().getFullYear()} {center.name}
        </p>
      </section>
    </div>
  );
}
