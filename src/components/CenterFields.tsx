import type { Center } from '@/lib/types';

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
      <div>
        <label className="label" htmlFor="accent_color">Color de marca</label>
        <input
          id="accent_color"
          name="accent_color"
          type="color"
          defaultValue={v.accent_color ?? '#be185d'}
          className="h-11 w-24 cursor-pointer rounded-lg border border-[var(--line)] bg-white p-1"
        />
      </div>
    </>
  );
}
