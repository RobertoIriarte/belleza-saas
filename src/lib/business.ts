/** Tipos de negocio: adaptan los textos del sitio público (etiqueta de portada, título del equipo…). */
export type BusinessType = {
  id: string;
  name: string; // en el selector y en la etiqueta sobre el título principal
  team: string; // título de la sección de profesionales
};

export const BUSINESS_TYPES: BusinessType[] = [
  { id: 'belleza', name: 'Centro de belleza', team: 'Nuestro equipo' },
  { id: 'barberia', name: 'Barbería', team: 'Nuestros barberos' },
  { id: 'peluqueria', name: 'Peluquería', team: 'Nuestros estilistas' },
  { id: 'unas', name: 'Estudio de uñas', team: 'Nuestras manicuristas' },
  { id: 'spa', name: 'Spa y masajes', team: 'Nuestros terapeutas' },
  { id: 'estetica', name: 'Centro de estética', team: 'Nuestras especialistas' },
  { id: 'otro', name: 'Otro', team: 'Nuestro equipo' },
];

export const businessOf = (id: string | null | undefined): BusinessType =>
  BUSINESS_TYPES.find((b) => b.id === id) ?? BUSINESS_TYPES[0];
