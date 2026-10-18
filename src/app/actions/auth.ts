'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const Credentials = z.object({
  email: z.string().trim().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export type AuthState = { error?: string; info?: string };

export async function signIn(_p: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = Credentials.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: 'Correo o contraseña incorrectos' };
  redirect('/admin');
}

export async function signUp(_p: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = Credentials.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/admin` },
  });
  if (error) return { error: error.message };

  // Si Supabase exige confirmar el correo, no hay sesión todavía
  if (!data.session) {
    return { info: 'Te enviamos un correo para confirmar tu cuenta. Revísalo y vuelve a ingresar.' };
  }
  redirect('/admin/nuevo');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
