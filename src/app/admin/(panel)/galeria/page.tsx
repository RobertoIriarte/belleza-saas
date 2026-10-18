import { requireCenter } from '@/lib/admin';
import GalleryManager from '@/components/GalleryManager';
import { GALLERY_MAX, type GalleryItem } from '@/lib/types';

export const metadata = { title: 'Galería · Panel' };
export const dynamic = 'force-dynamic';

export default async function GaleriaPage() {
  const { supabase, center } = await requireCenter();

  const { data } = await supabase
    .from('gallery_images')
    .select('id, url')
    .eq('center_id', center.id)
    .order('created_at', { ascending: false });

  const items = (data ?? []) as GalleryItem[];

  return (
    <div>
      <h1 className="font-display text-3xl">Galería de trabajos</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        Estas fotos aparecen en tu sitio público, en la sección “Nuestros trabajos”. Se reducen
        solas antes de subirse, así que puedes usar fotos directas del celular.
      </p>
      <div className="mt-8">
        <GalleryManager centerId={center.id} items={items} max={GALLERY_MAX} />
      </div>
    </div>
  );
}
