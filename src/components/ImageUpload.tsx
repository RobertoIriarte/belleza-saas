'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { saveImage } from '@/app/actions/media';
import { shrinkImage } from '@/lib/image';

type Props = {
  centerId: string;
  target: 'cover' | 'logo' | 'professional';
  professionalId?: string;
  currentUrl: string | null;
  label: string;
  hint?: string;
  /** Forma de la vista previa */
  shape?: 'portrait' | 'square' | 'wide';
  /** Lado mayor máximo al reducir la imagen, en píxeles */
  maxSide?: number;
};

const SHAPE: Record<NonNullable<Props['shape']>, string> = {
  portrait: 'aspect-[4/5] w-40',
  square: 'aspect-square w-32',
  wide: 'aspect-[16/9] w-56',
};

export default function ImageUpload({
  centerId,
  target,
  professionalId,
  currentUrl,
  label,
  hint,
  shape = 'portrait',
  maxSide = 1600,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(currentUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Elige un archivo de imagen');
      return;
    }

    setBusy(true);
    try {
      const blob = await shrinkImage(file, maxSide);

      // Nombre único por subida: evita que el navegador muestre la imagen antigua en caché
      const path = `${centerId}/${target}${professionalId ? `-${professionalId}` : ''}-${Date.now()}.jpg`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from('center-media')
        .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
      if (upErr) throw new Error('No se pudo subir la imagen. ¿Ejecutaste la migración 002_media.sql?');

      const publicUrl = supabase.storage.from('center-media').getPublicUrl(path).data.publicUrl;
      const res = await saveImage({ target, url: publicUrl, professionalId });
      if (res.error) throw new Error(res.error);

      setUrl(publicUrl);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error al subir la imagen');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onRemove() {
    setError(null);
    setBusy(true);
    const res = await saveImage({ target, url: null, professionalId });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setUrl(null);
    router.refresh();
  }

  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex items-end gap-4">
        <div
          className={`${SHAPE[shape]} grid shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-[var(--line)] bg-white`}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center text-xs text-[var(--muted)]">Sin imagen</span>
          )}
        </div>

        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="btn btn-ghost !px-4 !py-2 !text-sm disabled:opacity-60"
          >
            {busy ? 'Procesando…' : url ? 'Cambiar imagen' : 'Subir imagen'}
          </button>
          {url && (
            <button
              type="button"
              disabled={busy}
              onClick={onRemove}
              className="block text-xs text-[var(--muted)] hover:underline disabled:opacity-60"
            >
              Quitar
            </button>
          )}
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-[var(--muted)]">{hint}</p>}
      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
