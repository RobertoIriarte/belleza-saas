import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Center } from '@/lib/types';

/**
 * Devuelve el usuario y su centro. Si no hay sesión va a /login; si no tiene centro, a /admin/nuevo.
 * (MVP: un usuario administra un centro. Para multi-sucursal bastaría con un selector.)
 */
export const requireCenter = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: center } = await supabase
    .from('centers')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
    .maybeSingle();
  if (!center) redirect('/admin/nuevo');

  return { supabase, user, center: center as Center };
});

export const requireUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
});
