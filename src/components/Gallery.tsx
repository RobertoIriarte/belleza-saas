'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import type { GalleryItem } from '@/lib/types';

/** Cuadrícula de fotos con vista ampliada (clic o toque; Esc cierra, flechas navegan). */
export default function Gallery({ items, name }: { items: GalleryItem[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const move = useCallback(
    (step: number) =>
      setOpen((i) => (i === null ? i : (i + step + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close, move]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {items.map((it, i) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Ver foto ${i + 1} de ${items.length}`}
              className="group relative block aspect-square w-full overflow-hidden rounded-2xl bg-white"
            >
              <Image
                src={it.url}
                alt={`Trabajo de ${name}`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && items[open] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={items[open].url}
            alt={`Trabajo de ${name}`}
            className="max-h-[88vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-2xl leading-none text-white hover:bg-white/30"
          >
            ×
          </button>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  move(-1);
                }}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/30"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  move(1);
                }}
                aria-label="Foto siguiente"
                className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/30"
              >
                ›
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
                {open + 1} / {items.length}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
