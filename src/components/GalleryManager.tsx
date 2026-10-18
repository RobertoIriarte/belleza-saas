'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { shrinkImage } from '@/lib/image';
import { addGalleryImage, deleteGalleryImage } from '@/app/actions/media';
import type { GalleryItem } from '@/lib/types';

const MAX_PER_BATCH = 10;

export default function GalleryManager({
  centerId,
  items,
  max,
}: {
  centerId: string;
  items: GalleryItem[];
  max: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onPick(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const list = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, MAX_PER_BATCH);
    if (list.length === 0) {
      setError('Elige archivos de imagen');
      return;
    }
    if (items.length + list.length > max) {
      setError(`Tu galería admite hasta ${max} fotos y hoy tienes ${items.length}.`);
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const failures: string[] = [];

    for (let i = 0; i < list.length; i++) {
      setProgress(`Subiendo foto ${i + 1} de ${list.length}…`);
      const path = `${centerId}/gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      let uploaded = false;
      try {
        const blob = await shrinkImage(list[i], 1600);
        const { error: upErr } = await supabase.storage
          .from('center-media')
          .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
        if (upErr) throw new Error('No se pudo subir la imagen');
        uploaded = true;

        const url = supabase.storage.from('center-media').getPublicUrl(path).data.publicUrl;
        const res = await addGalleryImage({ url });
        if (res.error) throw new Error(res.error);
      } catch (e) {
        failures.push(e instanceof Error ? e.message : 'Error desconocido');
        // Si el archivo llegó a subirse pero no se registró, lo quitamos para no dejar basura
        if (uploaded) await supabase.storage.from('center-media').remove([path]);
      }
    }

    setBusy(false);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = '';
    if (failures.length > 0) {
      setError(`${failures.length} foto(s) no se pudieron subir. ${failures[0]}`);
    }
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!window.confirm('¿Eliminar esta foto de la galería?')) return;
    setError(null);
    setBusy(true);
    const res = await deleteGalleryImage({ id });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onPick(e.target.files)}
        />
        <button
          type="button"
          disabled={busy || items.length >= max}
          onClick={() => inputRef.current?.click()}
          className="btn btn-accent disabled:opacity-60"
        >
          {busy ? 'Subiendo…' : 'Subir fotos'}
        </button>
        <p className="text-sm text-[var(--muted)]">
          {items.length} de {max} fotos · hasta {MAX_PER_BATCH} a la vez
        </p>
        {progress && <p className="text-sm font-medium text-[var(--accent)]">{progress}</p>}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-[var(--line)] bg-white px-6 py-12 text-center text-sm text-[var(--muted)]">
          Aún no hay fotos. Sube cortes, peinados o trabajos terminados para mostrarlos en tu sitio.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <li
              key={it.id}
              className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--line)] bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt="Trabajo del centro" className="h-full w-full object-cover" />
              <button
                type="button"
                disabled={busy}
                onClick={() => onDelete(it.id)}
                aria-label="Eliminar foto"
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-lg leading-none text-white hover:bg-red-600 disabled:opacity-60"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
