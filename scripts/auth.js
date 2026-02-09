/**
 * playthings — Auth Module
 * Handles Supabase authentication for protected pages
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * Get the current logged-in user session
 */
export async function getSession() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get the current user
 */
export async function getUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  if (!supabase) {
    throw new Error('Authentication is not configured. Please set up Supabase credentials.');
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Sign up with email and password
 */
export async function signUp(email, password) {
  if (!supabase) {
    throw new Error('Authentication is not configured. Please set up Supabase credentials.');
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  if (!supabase) {
    throw new Error('Authentication is not configured.');
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/login'
  });
  if (error) throw error;
}

/**
 * Auth guard — redirects to login if no session
 * Call this at the top of any protected page
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = '/login';
    return null;
  }
  return session;
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback) {
  if (!supabase) return;
  supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

export { supabase };
