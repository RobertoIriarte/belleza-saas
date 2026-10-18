export type HourRow = { weekday: number; start_time: string; end_time: string };

// Lunes a domingo; los índices coinciden con `weekday` (0 = domingo)
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Resume los horarios del equipo en líneas legibles para la landing.
 * Une los tramos de todos los profesionales por día y agrupa los días
 * consecutivos con el mismo horario: [{ days: 'Lun–Vie', text: '09:00–18:00' }, ...]
 * Devuelve [] si nadie tiene horario cargado.
 */
export function summarizeHours(rows: HourRow[]): { days: string; text: string }[] {
  const perDay = new Map<number, string>();

  for (const d of ORDER) {
    const intervals = rows
      .filter((r) => r.weekday === d)
      .map((r): [string, string] => [r.start_time.slice(0, 5), r.end_time.slice(0, 5)])
      .sort((a, b) => a[0].localeCompare(b[0]));

    // Unir tramos que se solapan o se tocan
    const merged: [string, string][] = [];
    for (const [start, end] of intervals) {
      const last = merged[merged.length - 1];
      if (last && start <= last[1]) {
        if (end > last[1]) last[1] = end;
      } else {
        merged.push([start, end]);
      }
    }

    perDay.set(d, merged.length ? merged.map(([s, e]) => `${s}–${e}`).join(' · ') : 'Cerrado');
  }

  if ([...perDay.values()].every((v) => v === 'Cerrado')) return [];

  const out: { days: string; text: string }[] = [];
  let i = 0;
  while (i < ORDER.length) {
    const text = perDay.get(ORDER[i]) ?? 'Cerrado';
    let j = i;
    while (j + 1 < ORDER.length && perDay.get(ORDER[j + 1]) === text) j++;
    out.push({
      days: i === j ? SHORT[ORDER[i]] : `${SHORT[ORDER[i]]}–${SHORT[ORDER[j]]}`,
      text,
    });
    i = j + 1;
  }
  return out;
}
