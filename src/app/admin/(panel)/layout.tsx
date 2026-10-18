import { themeVars } from '@/lib/themes';
import Link from 'next/link';
import { requireCenter } from '@/lib/admin';
import { signOut } from '@/app/actions/auth';

const nav = [
  { href: '/admin', label: 'Citas' },
  { href: '/admin/servicios', label: 'Servicios' },
  { href: '/admin/equipo', label: 'Equipo' },
  { href: '/admin/galeria', label: 'Galería' },
  { href: '/admin/ajustes', label: 'Ajustes' },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { center } = await requireCenter();

  return (
    <div style={themeVars(center)} className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span className="font-display text-xl font-semibold">{center.name}</span>
          <div className="flex items-center gap-4 text-sm">
            <Link href={`/c/${center.slug}`} target="_blank" className="text-[var(--accent)] hover:underline">
              Ver sitio ↗
            </Link>
            <form action={signOut}>
              <button className="text-[var(--muted)] hover:underline">Salir</button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
