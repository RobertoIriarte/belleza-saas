'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCLP, type Service } from '@/lib/types';
import { fmtDuration } from '@/lib/format';
import type { ServiceGroup } from '@/lib/categories';

type Item = Pick<Service, 'id' | 'name' | 'description' | 'duration_min' | 'price'>;
export type CatalogGroup = Omit<ServiceGroup, 'services'> & { services: Item[] };

function ServiceRow({ s, href }: { s: Item; href: string }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white p-4">
      <div className="min-w-0">
        <p className="font-semibold">{s.name}</p>
        {s.description && <p className="mt-1 text-sm text-[var(--muted)]">{s.description}</p>}
        <p className="mt-2 text-xs text-[var(--muted)]">{fmtDuration(s.duration_min)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-lg font-semibold">{formatCLP(s.price)}</span>
        <Link href={`${href}?servicio=${s.id}`} className="btn btn-accent !px-4 !py-2 !text-sm">
          Reservar
        </Link>
      </div>
    </li>
  );
}

/**
 * Catálogo de servicios del sitio público. Con categorías muestra una tarjeta por categoría
 * y, al tocarla, abre una ventana con sus servicios. Sin categorías muestra la lista directa.
 */
export default function ServiceCatalog({
  groups,
  reservarHref,
  hasCategories,
}: {
  groups: CatalogGroup[];
  reservarHref: string;
  hasCategories: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  if (!hasCategories) {
    return (
      <ul className="space-y-3">
        {groups.flatMap((g) => g.services).map((s) => (
          <ServiceRow key={s.id} s={s} href={reservarHref} />
        ))}
      </ul>
    );
  }

  const current = open !== null ? groups[open] : null;
  const anyImage = groups.some((g) => g.imageUrl);

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g, i) => {
          const from = Math.min(...g.services.map((s) => s.price));
          return (
            <li key={g.id ?? 'otros'}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-white text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)]/60 hover:shadow-md"
              >
                {anyImage && (
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--soft)]">
                    {g.imageUrl ? (
                      <Image
                        src={g.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center font-display text-7xl text-[var(--accent)]/30">
                        {g.name.charAt(0)}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <h3 className="font-display text-2xl">{g.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {g.services.length} {g.services.length === 1 ? 'servicio' : 'servicios'}
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">
                    Desde <span className="font-semibold text-[var(--ink)]">{formatCLP(from)}</span>
                  </span>
                  <span className="font-semibold text-[var(--accent)] transition group-hover:translate-x-0.5">
                    Ver servicios →
                  </span>
                </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.name}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-6"
          onClick={close}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-t-3xl bg-[var(--paper)] shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {current.imageUrl && (
              <div className="relative aspect-[21/9] w-full shrink-0 overflow-hidden rounded-t-3xl">
                <Image src={current.imageUrl} alt="" fill sizes="672px" className="object-cover" />
              </div>
            )}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
              <div>
                <h3 className="font-display text-3xl">{current.name}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Elige un servicio para reservar tu hora.
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-white text-xl leading-none hover:bg-[var(--soft)]"
              >
                ×
              </button>
            </div>
            <ul className="space-y-3 overflow-y-auto px-6 py-5">
              {current.services.map((s) => (
                <ServiceRow key={s.id} s={s} href={reservarHref} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
