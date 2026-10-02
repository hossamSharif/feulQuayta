'use server';

import { createServerSupabase } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function loginUser(email: string, password: string) {
  const supabase = createServerSupabase();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Revalidate paths that might depend on auth state
  revalidatePath('/');
  revalidatePath('/station');
  revalidatePath('/admin');
}

export async function logoutUser() {
  const supabase = createServerSupabase();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  // Revalidate paths that might depend on auth state
  revalidatePath('/');
  revalidatePath('/station');
  revalidatePath('/admin');
}

export async function fetchUserProfile() {
  const supabase = createServerSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, station_id')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return {
    id: data.id,
    role: data.role,
    station_id: data.station_id,
  };
}