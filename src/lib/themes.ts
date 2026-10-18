import type { CSSProperties } from 'react';

export type Palette = {
  id: string;
  name: string;
  accent: string; // botones, enlaces y detalles
  ink: string; // texto principal y bloque oscuro del pie
  paper: string; // fondo de la página
  muted: string; // texto secundario
  line: string; // bordes
  soft: string; // fondo suave (portada sin foto, hover)
};

export const PALETTES: Palette[] = [
  { id: 'rosa', name: 'Rosa clásico', accent: '#be185d', ink: '#1f1720', paper: '#fdfaf7', muted: '#7a6f77', line: '#eadfd8', soft: '#fdf2f8' },
  { id: 'dorado', name: 'Negro y dorado', accent: '#a16207', ink: '#1c1917', paper: '#faf9f6', muted: '#78716c', line: '#e7e2d8', soft: '#faf1da' },
  { id: 'salvia', name: 'Salvia', accent: '#3f6b4f', ink: '#14201a', paper: '#f8faf7', muted: '#6b7a70', line: '#dde5dd', soft: '#eaf3ec' },
  { id: 'oceano', name: 'Océano', accent: '#0e7490', ink: '#0f1f26', paper: '#f6fafb', muted: '#64757d', line: '#d8e5e9', soft: '#e3f3f7' },
  { id: 'violeta', name: 'Violeta', accent: '#7c3aed', ink: '#1e1730', paper: '#faf8fd', muted: '#766f87', line: '#e4dcf0', soft: '#f1eafd' },
  { id: 'terracota', name: 'Terracota', accent: '#c2410c', ink: '#271a14', paper: '#fdf8f4', muted: '#7d6c63', line: '#ecdcd0', soft: '#fdeee3' },
  { id: 'barberia', name: 'Barbería', accent: '#b91c1c', ink: '#111111', paper: '#f7f7f5', muted: '#6b6b6b', line: '#e0e0dc', soft: '#f3e6e6' },
];

export const CUSTOM_ID = 'personalizado';
const BASE = PALETTES[0];

export const paletteById = (id: string | null | undefined) => PALETTES.find((p) => p.id === id);

/** Paleta efectiva de un centro. Sin paleta guardada (o "personalizado") se usa su color de marca. */
export function resolvePalette(c: { palette?: string | null; accent_color: string }): Palette {
  const preset = paletteById(c.palette);
  if (preset) return preset;
  return { ...BASE, id: CUSTOM_ID, name: 'Personalizado', accent: c.accent_color };
}

/** Variables CSS del tema; se aplican en el contenedor raíz del sitio o del panel del centro. */
export function themeVars(c: { palette?: string | null; accent_color: string }): CSSProperties {
  const p = resolvePalette(c);
  return {
    '--accent': p.accent,
    '--ink': p.ink,
    '--paper': p.paper,
    '--muted': p.muted,
    '--line': p.line,
    '--soft': p.soft,
    background: p.paper,
    color: p.ink,
  } as CSSProperties;
}
