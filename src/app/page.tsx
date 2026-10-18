import Link from 'next/link';

const features = [
  { t: 'Sitio propio en minutos', d: 'Cada centro tiene su página con servicios, precios y equipo, lista para compartir.' },
  { t: 'Agenda sin doble reserva', d: 'Horarios por profesional, descansos y bloqueos. Dos clientes nunca toman la misma hora.' },
  { t: 'Panel simple', d: 'Administra servicios, profesionales y citas desde el celular.' },
  { t: 'Agente de WhatsApp', d: 'Tus clientas agendan, cambian o cancelan conversando. Próximamente.' },
];

export default function Home() {
  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="font-display text-xl font-semibold">Agenda Belleza</span>
        <Link href="/login" className="btn btn-ghost !py-2">Ingresar</Link>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[.2em] text-[var(--accent)]">
          Para salones, spas y centros estéticos
        </p>
        <h1 className="font-display text-5xl leading-[1.05] sm:text-7xl">
          Tu centro lleno, tu agenda ordenada.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--muted)]">
          Publica tus servicios, muestra a tu equipo y deja que tus clientas reserven online, a cualquier hora.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link href="/login" className="btn btn-accent">Crear mi centro</Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.t} className="card p-6">
            <h3 className="font-semibold">{f.t}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{f.d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
