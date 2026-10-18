import type { Service, ServiceCategory } from '@/lib/types';

export type ServiceGroup = {
  id: string | null;
  name: string;
  imageUrl: string | null;
  services: Service[];
};

/**
 * Agrupa servicios por categoría respetando el orden de las categorías.
 * Los servicios sin categoría van al final. Con `keepEmpty` también se devuelven
 * las categorías vacías (útil en el panel; en el sitio público se ocultan).
 */
export function groupServices(
  services: Service[],
  categories: ServiceCategory[],
  keepEmpty = false,
): ServiceGroup[] {
  const groups: ServiceGroup[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    imageUrl: c.image_url ?? null,
    services: services.filter((s) => s.category_id === c.id),
  }));
  const known = new Set(categories.map((c) => c.id));
  const loose = services.filter((s) => !s.category_id || !known.has(s.category_id));
  if (loose.length > 0) {
    groups.push({ id: null, name: categories.length > 0 ? 'Otros servicios' : 'Servicios', imageUrl: null, services: loose });
  }
  return keepEmpty ? groups : groups.filter((g) => g.services.length > 0);
}
