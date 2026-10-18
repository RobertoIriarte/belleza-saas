'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions/admin';

/** Formulario con estado (error / guardado) para server actions del panel. */
export default function StatefulForm({
  action,
  children,
  submitLabel = 'Guardar',
  className = 'space-y-4',
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && !state.error && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Guardado ✓</p>
      )}
      <button disabled={pending} className="btn btn-accent disabled:opacity-60">
        {pending ? 'Guardando…' : submitLabel}
      </button>
    </form>
  );
}
