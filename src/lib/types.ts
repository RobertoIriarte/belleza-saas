export type Center = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  instagram: string | null;
  timezone: string;
  accent_color: string;
  slot_step_min: number;
  min_notice_min: number;
  max_days_ahead: number;
  owner_id: string;
  logo_url: string | null;
  cover_url: string | null;
};

export type Service = {
  id: string;
  center_id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_min: number;
  price: number;
  active: boolean;
  sort_order: number;
};

export type Professional = {
  id: string;
  center_id: string;
  name: string;
  role: string | null;
  bio: string | null;
  photo_url: string | null;
  active: boolean;
  sort_order: number;
};

export type WorkingHour = {
  id: string;
  professional_id: string;
  weekday: number;
  start_time: string; // "HH:MM:SS"
  end_time: string;
};

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export type Appointment = {
  id: string;
  center_id: string;
  professional_id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  notes: string | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  source: 'web' | 'whatsapp' | 'admin';
  manage_token: string;
  created_at: string;
};

export type Slot = { start: string; end: string; professionalId: string };

/** Máximo de fotos en la galería de un centro */
export const GALLERY_MAX = 24;

export type GalleryItem = { id: string; url: string };

export const WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
  no_show: 'No asistió',
};

export function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);
}
