'use client';

import { useFormStatus } from 'react-dom';
import Spinner from '@/components/Spinner';

/** Botón de formulario que se desactiva y muestra una ruedita mientras la acción se ejecuta. */
export default function SubmitButton({
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button {...rest} disabled={pending || rest.disabled} className={`${className ?? ''} disabled:opacity-60`}>
      {pending ? <Spinner size={14} /> : children}
    </button>
  );
}
