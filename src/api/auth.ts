import { supabase } from './supabaseClient';
import type { Profile, UserRole } from '../types/database.types';

export async function signUp(email: string, password: string, fullName: string, role: UserRole = 'customer') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
    },
  });
  console.log("Signup to user", data);
  if (error) throw error;

  if (!data.session) {
    // No session means email confirmation is required before login —
    // profile will need to be created on first sign-in instead.
    return data;
  }

  if (data.user) {
    console.log("Sign up profile ....", data)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
      vendor_status: role === 'vendor' ? 'pending' : null,
    });
    if (profileError) throw profileError;
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
   .maybeSingle();
  if (error) {
    if (error.code === 'PGRST116') return null; // no row found
    throw error;
  }
  return data as Profile;
}
