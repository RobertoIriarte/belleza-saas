import type { Center } from '@/lib/types';
import { BUSINESS_TYPES } from '@/lib/business';

type V = Partial<Center>;

function Field({
  label,
  name,
  value,
  placeholder,
  required,
  type = 'text',
  hint,
}: {
  label: string;
  name: string;
  value?: string | number | null;
  placeholder?: string;
  required?: boolean;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={value ?? ''}
        placeholder={placeholder}
        required={required}
        className="input"
      />
      {hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

/** Campos compartidos por "crear centro" y "ajustes". */
export default function CenterFields({ v = {} }: { v?: V }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del centro" name="name" value={v.name} required placeholder="Studio Aurora" />
        <Field
          label="URL pública"
          name="slug"
          value={v.slug}
          required
          placeholder="studio-aurora"
          hint="Tu sitio: /c/tu-url"
        />
      </div>
      <div>
        <label className="label" htmlFor="business_type">Tipo de negocio</label>
        <select id="business_type" name="business_type" defaultValue={v.business_type ?? 'belleza'} className="input">
          {BUSINESS_TYPES.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--muted)]">Adapta los textos de tu sitio público.</p>
      </div>
      <Field label="Frase principal" name="tagline" value={v.tagline} placeholder="Belleza que se siente" />
      <div>
        <label className="label" htmlFor="description">Descripción</label>
        <textarea id="description" name="description" rows={3} defaultValue={v.description ?? ''} className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="WhatsApp" name="whatsapp" value={v.whatsapp} placeholder="+56912345678" />
        <Field label="Teléfono" name="phone" value={v.phone} />
        <Field label="Correo" name="email" type="email" value={v.email} />
        <Field label="Instagram" name="instagram" value={v.instagram} placeholder="studioaurora" />
        <Field label="Dirección" name="address" value={v.address} />
        <Field label="Ciudad" name="city" value={v.city} placeholder="Santiago" />
      </div>
    </>
  );
}
