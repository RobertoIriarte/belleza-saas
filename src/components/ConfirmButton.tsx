'use client';

import { useFormStatus } from 'react-dom';
import Spinner from '@/components/Spinner';

/** Botón de envío que pide confirmación antes de ejecutar la acción del formulario. */
export default function ConfirmButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className={`${className ?? ''} disabled:opacity-60`}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? <Spinner size={14} /> : children}
    </button>
  );
}
