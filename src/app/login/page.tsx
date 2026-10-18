'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { signIn, signUp, type AuthState } from '@/app/actions/auth';

export default function LoginPage() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === 'in' ? signIn : signUp,
    {},
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" className="font-display mb-8 text-2xl font-semibold">Agenda Belleza</Link>
      <div className="card p-8">
        <h1 className="font-display text-3xl">{mode === 'in' ? 'Ingresa a tu panel' : 'Crea tu cuenta'}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {mode === 'in' ? 'Gestiona servicios, equipo y citas.' : 'Registra tu centro en minutos.'}
        </p>

        <form action={action} className="mt-6 space-y-4" key={mode}>
          <div>
            <label className="label" htmlFor="email">Correo</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              className="input"
            />
          </div>
          {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
          {state.info && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.info}</p>}
          <button disabled={pending} className="btn btn-accent w-full disabled:opacity-60">
            {pending ? 'Un momento…' : mode === 'in' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === 'in' ? 'up' : 'in')}
          className="mt-5 w-full text-center text-sm text-[var(--muted)] hover:underline"
        >
          {mode === 'in' ? '¿Aún no tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Ingresa'}
        </button>
      </div>
    </main>
  );
}
