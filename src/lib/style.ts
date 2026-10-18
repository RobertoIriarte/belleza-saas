import type { CSSProperties } from 'react';

/** Expone el color de marca del centro como variable CSS `--accent`. */
export function accentVars(color: string): CSSProperties {
  return { '--accent': color } as CSSProperties;
}
