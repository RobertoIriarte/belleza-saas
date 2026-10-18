export function fmtTime(iso: string, tz: string) {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export function fmtDateLong(iso: string, tz: string) {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));
}

export function fmtDateTime(iso: string, tz: string) {
  return `${fmtDateLong(iso, tz)}, ${fmtTime(iso, tz)}`;
}

export function fmtDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Deja sólo dígitos y un "+" inicial opcional. */
export function normalizePhone(raw: string) {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  return plus + trimmed.replace(/\D/g, '');
}

export function whatsappLink(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
