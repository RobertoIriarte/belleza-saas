'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireCenter } from '@/lib/admin';
import { GALLERY_MAX } from '@/lib/types';

const Input = z.object({
  target: z.enum(['cover', 'logo', 'professional', 'category']),
  url: z.string().url().max(600).nullable(),
  professionalId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
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
  const { target, url, professionalId, categoryId } = parsed.data;

  const { supabase, center } = await requireCenter();

  if (url) {
    const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/center-media/${center.id}/`;
    if (!url.startsWith(prefix)) return { error: 'Imagen no válida' };
  }

  // Imagen que estaba guardada antes: si se reemplaza o se quita, hay que borrar su archivo
  let previousUrl: string | null = null;

  if (target === 'professional') {
    if (!professionalId) return { error: 'Falta el profesional' };
    const { data: current } = await supabase
      .from('professionals')
      .select('photo_url')
      .eq('id', professionalId)
      .eq('center_id', center.id)
      .single();
    previousUrl = (current?.photo_url as string | null | undefined) ?? null;

    const { error } = await supabase
      .from('professionals')
      .update({ photo_url: url })
      .eq('id', professionalId)
      .eq('center_id', center.id);
    if (error) return { error: 'No se pudo guardar la foto' };
  } else if (target === 'category') {
    if (!categoryId) return { error: 'Falta la categoría' };
    const { data: current } = await supabase
      .from('service_categories')
      .select('image_url')
      .eq('id', categoryId)
      .eq('center_id', center.id)
      .single();
    previousUrl = (current?.image_url as string | null | undefined) ?? null;

    const { error } = await supabase
      .from('service_categories')
      .update({ image_url: url })
      .eq('id', categoryId)
      .eq('center_id', center.id);
    if (error) {
      return { error: 'No se pudo guardar. ¿Ejecutaste la migración 008_category_images.sql?' };
    }
  } else {
    previousUrl = (target === 'cover' ? center.cover_url : center.logo_url) ?? null;
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

  // Recién ahora, con la base ya actualizada, se borra el archivo anterior
  if (previousUrl && previousUrl !== url) {
    await removeStored(supabase, center.id, previousUrl);
  }

  revalidatePath(`/c/${center.slug}`);
  revalidatePath('/admin/ajustes');
  revalidatePath('/admin/equipo');
  revalidatePath('/admin/servicios');
  if (professionalId) revalidatePath(`/admin/equipo/${professionalId}`);
  return { ok: true };
}

// ---------------------------------------------------------------- Galería

function mediaPrefix(centerId: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/center-media/${centerId}/`;
}

type Db = Awaited<ReturnType<typeof requireCenter>>['supabase'];

/**
 * Borra de Storage el archivo al que apunta una URL pública, pero sólo si está en la
 * carpeta del propio centro. Si falla no se interrumpe nada: lo peor es un archivo huérfano.
 */
async function removeStored(supabase: Db, centerId: string, url: string | null | undefined) {
  if (!url) return;
  const prefix = mediaPrefix(centerId);
  if (!url.startsWith(prefix)) return;
  await supabase.storage.from('center-media').remove([`${centerId}/${url.slice(prefix.length)}`]);
}

const GalleryAdd = z.object({ url: z.string().url().max(600) });

/** Registra en la galería una foto ya subida a Storage (con límite de fotos por centro). */
export async function addGalleryImage(input: z.infer<typeof GalleryAdd>): Promise<Result> {
  const parsed = GalleryAdd.safeParse(input);
  if (!parsed.success) return { error: 'Datos inválidos' };

  const { supabase, center } = await requireCenter();
  if (!parsed.data.url.startsWith(mediaPrefix(center.id))) return { error: 'Imagen no válida' };

  const { count } = await supabase
    .from('gallery_images')
    .select('id', { count: 'exact', head: true })
    .eq('center_id', center.id);
  if ((count ?? 0) >= GALLERY_MAX) {
    return { error: `La galería admite hasta ${GALLERY_MAX} fotos` };
  }

  const { error } = await supabase
    .from('gallery_images')
    .insert({ center_id: center.id, url: parsed.data.url });
  if (error) {
    return { error: 'No se pudo guardar la foto. ¿Ejecutaste la migración 003_gallery.sql?' };
  }

  revalidatePath(`/c/${center.slug}`);
  revalidatePath('/admin/galeria');
  return { ok: true };
}

const GalleryDelete = z.object({ id: z.string().uuid() });

/** Elimina una foto de la galería y, si es posible, también el archivo de Storage. */
export async function deleteGalleryImage(input: z.infer<typeof GalleryDelete>): Promise<Result> {
  const parsed = GalleryDelete.safeParse(input);
  if (!parsed.success) return { error: 'Datos inválidos' };

  const { supabase, center } = await requireCenter();

  const { data: row } = await supabase
    .from('gallery_images')
    .select('url')
    .eq('id', parsed.data.id)
    .eq('center_id', center.id)
    .single();
  if (!row) return { error: 'La foto ya no existe' };

  const { error } = await supabase
    .from('gallery_images')
    .delete()
    .eq('id', parsed.data.id)
    .eq('center_id', center.id);
  if (error) return { error: 'No se pudo eliminar la foto' };

  // Borrado del archivo: si falla no importa, la foto ya no aparece en el sitio
  await removeStored(supabase, center.id, String(row.url));

  revalidatePath(`/c/${center.slug}`);
  revalidatePath('/admin/galeria');
  return { ok: true };
}
