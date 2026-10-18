'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { shrinkImage } from '@/lib/image';

/**
 * Selector de foto para formularios de creación (donde el registro aún no existe).
 * Sube la imagen reducida a Storage y deja su URL en un campo oculto `photo_url`,
 * que se envía junto con el resto del formulario.
 */
export default function PhotoPicker({
  centerId,
  label = 'Foto (opcional)',
  maxSide = 1200,
}: {
  centerId: string;
  label?: string;
  maxSide?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function discardCurrent() {
    if (!path) return;
    // Si no se alcanza a borrar, queda un archivo huérfano: no es grave
    await createClient().storage.from('center-media').remove([path]);
  }

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
      const newPath = `${centerId}/professional-new-${Date.now()}.jpg`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from('center-media')
        .upload(newPath, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
      if (upErr) throw new Error('No se pudo subir la imagen. ¿Ejecutaste la migración 002_media.sql?');

      await discardCurrent();
      setPath(newPath);
      setUrl(supabase.storage.from('center-media').getPublicUrl(newPath).data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error al subir la imagen');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onRemove() {
    setBusy(true);
    await discardCurrent();
    setBusy(false);
    setUrl(null);
    setPath(null);
  }

  return (
    <div>
      <p className="label">{label}</p>
      <input type="hidden" name="photo_url" value={url ?? ''} />
      <div className="flex items-center gap-4">
        <div className="grid aspect-[4/5] w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-[var(--line)] bg-white">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Foto del profesional" className="h-full w-full object-cover" />
          ) : (
            <span className="px-1 text-center text-[11px] text-[var(--muted)]">Sin foto</span>
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
            {busy ? 'Procesando…' : url ? 'Cambiar foto' : 'Subir foto'}
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
      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
