import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates and returns a Supabase browser client.
 * Supports both Next.js (process.env.NEXT_PUBLIC_*) and Vite (import.meta.env.VITE_*) environments.
 */
export const createClient = () => {
  const supabaseUrl = 
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || 
    (typeof window !== 'undefined' && (window as any).__env__?.NEXT_PUBLIC_SUPABASE_URL) ||
    ((import.meta as any).env?.VITE_SUPABASE_URL) ||
    '';

  const supabaseAnonKey = 
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 
    (typeof window !== 'undefined' && (window as any).__env__?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
    '';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
