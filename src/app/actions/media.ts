'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireCenter } from '@/lib/admin';

const Input = z.object({
  target: z.enum(['cover', 'logo', 'professional']),
  url: z.string().url().max(600).nullable(),
  professionalId: z.string().uuid().optional(),
});

type Result = { ok?: boolean; error?: string };

/**
 * Guarda (o quita, con url = null) la imagen de un centro o de un profesional.
 * La subida del archivo ocurre directo desde el navegador a Supabase Storage,
 * protegida por RLS. Aquí sólo validamos que la URL pertenezca a la carpeta del
 * centro del usuario, para que nadie pueda apuntar a imágenes ajenas o externas.
 */
export async function saveImage(input: z.infer<typeof Input>): Promise<Result> {
  const parsed = Input.safeParse(input);
  if (!parsed.success) return { error: 'Datos inválidos' };
  const { target, url, professionalId } = parsed.data;

  const { supabase, center } = await requireCenter();

  if (url) {
    const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/center-media/${center.id}/`;
    if (!url.startsWith(prefix)) return { error: 'Imagen no válida' };
  }

  if (target === 'professional') {
    if (!professionalId) return { error: 'Falta el profesional' };
    const { error } = await supabase
      .from('professionals')
      .update({ photo_url: url })
      .eq('id', professionalId)
      .eq('center_id', center.id);
    if (error) return { error: 'No se pudo guardar la foto' };
  } else {
    const column = target === 'cover' ? 'cover_url' : 'logo_url';
    const { error } = await supabase
      .from('centers')
      .update({ [column]: url })
      .eq('id', center.id);
    if (error) {
      return {
        error:
          'No se pudo guardar. ¿Ejecutaste la migración 002_media.sql en Supabase?',
      };
    }
  }

  revalidatePath(`/c/${center.slug}`);
  revalidatePath('/admin/ajustes');
  revalidatePath('/admin/equipo');
  if (professionalId) revalidatePath(`/admin/equipo/${professionalId}`);
  return { ok: true };
}
