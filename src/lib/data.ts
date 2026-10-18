import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { HourRow } from '@/lib/hours';
import { GALLERY_MAX, TESTIMONIALS_MAX, type Testimonial, type Center, type GalleryItem, type Professional, type Service, type ServiceCategory } from '@/lib/types';

export type CenterBundle = {
  center: Center;
  services: Service[];
  categories: ServiceCategory[];
  professionals: (Professional & { serviceIds: string[] })[];
  /** Horarios de todos los profesionales activos (para mostrar el horario de atención) */
  hours: HourRow[];
  /** Fotos de trabajos, las más recientes primero */
  gallery: GalleryItem[];
  /** Testimonios activos, los más recientes primero */
  testimonials: Testimonial[];
};

/** Carga todo lo público de un centro. `cache` evita repetir consultas en la misma request. */
export const getCenterBundle = cache(async (slug: string): Promise<CenterBundle | null> => {
  const supabase = await createClient();

  const { data: center } = await supabase.from('centers').select('*').eq('slug', slug).single();
  if (!center) return null;

  const [{ data: services }, { data: professionals }, { data: links }, { data: galleryRows }, { data: categoryRows }, { data: testimonialRows }] =
    await Promise.all([
    supabase
      .from('services')
      .select('*')
      .eq('center_id', center.id)
      .eq('active', true)
      .order('sort_order')
      .order('name'),
    supabase
      .from('professionals')
      .select('*')
      .eq('center_id', center.id)
      .eq('active', true)
      .order('sort_order')
      .order('name'),
    supabase.from('professional_services').select('professional_id, service_id'),
    // Si la migración de galería aún no se ejecutó, la consulta falla y simplemente no hay fotos
    supabase
      .from('gallery_images')
      .select('id, url')
      .eq('center_id', center.id)
      .order('created_at', { ascending: false })
      .limit(GALLERY_MAX),
    // Si la migración de categorías aún no se ejecutó, simplemente no hay categorías
    supabase
      .from('service_categories')
      .select('*')
      .eq('center_id', center.id)
      .order('sort_order')
      .order('name'),
    // Si la migración de testimonios aún no se ejecutó, simplemente no hay testimonios
    supabase
      .from('testimonials')
      .select('*')
      .eq('center_id', center.id)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(TESTIMONIALS_MAX),
  ]);

  const pros = (professionals ?? []) as Professional[];

  // Horarios de los profesionales activos de este centro
  let hours: HourRow[] = [];
  if (pros.length > 0) {
    const { data } = await supabase
      .from('working_hours')
      .select('weekday, start_time, end_time')
      .in(
        'professional_id',
        pros.map((p) => p.id),
      );
    hours = (data ?? []) as HourRow[];
  }

  const byProf = new Map<string, string[]>();
  for (const l of links ?? []) {
    byProf.set(l.professional_id, [...(byProf.get(l.professional_id) ?? []), l.service_id]);
  }

  return {
    center: center as Center,
    services: (services ?? []) as Service[],
    categories: (categoryRows ?? []) as ServiceCategory[],
    professionals: pros.map((p) => ({
      ...p,
      serviceIds: byProf.get(p.id) ?? [],
    })),
    hours,
    gallery: (galleryRows ?? []) as GalleryItem[],
    testimonials: (testimonialRows ?? []) as Testimonial[],
  };
});
