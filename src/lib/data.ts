import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Center, Professional, Service } from '@/lib/types';

export type CenterBundle = {
  center: Center;
  services: Service[];
  professionals: (Professional & { serviceIds: string[] })[];
};

/** Carga todo lo público de un centro. `cache` evita repetir consultas en la misma request. */
export const getCenterBundle = cache(async (slug: string): Promise<CenterBundle | null> => {
  const supabase = await createClient();

  const { data: center } = await supabase.from('centers').select('*').eq('slug', slug).single();
  if (!center) return null;

  const [{ data: services }, { data: professionals }, { data: links }] = await Promise.all([
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
  ]);

  const byProf = new Map<string, string[]>();
  for (const l of links ?? []) {
    byProf.set(l.professional_id, [...(byProf.get(l.professional_id) ?? []), l.service_id]);
  }

  return {
    center: center as Center,
    services: (services ?? []) as Service[],
    professionals: ((professionals ?? []) as Professional[]).map((p) => ({
      ...p,
      serviceIds: byProf.get(p.id) ?? [],
    })),
  };
});
