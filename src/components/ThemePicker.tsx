'use client';

import { useState } from 'react';
import { CUSTOM_ID, PALETTES } from '@/lib/themes';

/** Selector de paleta con vista previa. Envía los campos `palette` y `accent_color`. */
export default function ThemePicker({
  current,
  customColor,
}: {
  current: string;
  customColor: string;
}) {
  const [palette, setPalette] = useState(current);
  const [color, setColor] = useState(customColor);

  const preview = PALETTES.find((p) => p.id === palette) ?? {
    accent: color,
    ink: '#1f1720',
    paper: '#fdfaf7',
    muted: '#7a6f77',
    line: '#eadfd8',
    soft: '#fdf2f8',
  };

  return (
    <div className="space-y-5">
      <input type="hidden" name="palette" value={palette} />
      <input type="hidden" name="accent_color" value={color} />

      <div role="radiogroup" aria-label="Paleta de colores" className="grid gap-3 sm:grid-cols-2">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={palette === p.id}
            onClick={() => setPalette(p.id)}
            className={`flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left text-sm transition ${
              palette === p.id
                ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20'
                : 'border-[var(--line)] hover:border-[var(--accent)]/50'
            }`}
          >
            <span className="flex shrink-0 overflow-hidden rounded-full border border-black/10">
              <span className="h-8 w-8" style={{ background: p.accent }} />
              <span className="h-8 w-5" style={{ background: p.ink }} />
              <span className="h-8 w-5" style={{ background: p.soft }} />
            </span>
            <span className="font-medium">{p.name}</span>
          </button>
        ))}

        <button
          type="button"
          role="radio"
          aria-checked={palette === CUSTOM_ID}
          onClick={() => setPalette(CUSTOM_ID)}
          className={`flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left text-sm transition ${
            palette === CUSTOM_ID
              ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20'
              : 'border-[var(--line)] hover:border-[var(--accent)]/50'
          }`}
        >
          <span className="h-8 w-8 shrink-0 rounded-full border border-black/10" style={{ background: color }} />
          <span className="font-medium">Personalizado</span>
        </button>
      </div>

      {palette === CUSTOM_ID && (
        <div>
          <label className="label" htmlFor="custom-color">Tu color de marca</label>
          <input
            id="custom-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-11 w-24 cursor-pointer rounded-lg border border-[var(--line)] bg-white p-1"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Elige un color medio u oscuro: los botones llevan texto blanco.
          </p>
        </div>
      )}

      {/* Vista previa */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: preview.paper, borderColor: preview.line, color: preview.ink }}
      >
        <p className="text-xs font-semibold uppercase tracking-[.2em]" style={{ color: preview.accent }}>
          Vista previa
        </p>
        <p className="mt-2 font-display text-2xl">Tu momento de cuidarte</p>
        <p className="mt-1 text-sm" style={{ color: preview.muted }}>
          Así se verán los textos, botones y fondos.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className="rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ background: preview.accent }}
          >
            Reservar
          </span>
          <span className="rounded-full px-4 py-2 text-sm" style={{ background: preview.soft }}>
            Detalle suave
          </span>
          <span className="rounded-full px-4 py-2 text-sm text-white" style={{ background: preview.ink }}>
            Pie de página
          </span>
        </div>
      </div>
    </div>
  );
}
