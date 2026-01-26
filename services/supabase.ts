import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

export const createSupabaseClient = (getToken?: () => Promise<string | null>): SupabaseClient => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL/Key missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY.');
  }
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: async (url, init = {}) => {
        const headers = new Headers(init.headers ?? {});
        if (getToken) {
          const token = await getToken();
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
        }
        return fetch(url, { ...init, headers });
      },
    },
  });
};

export const supabase = supabaseUrl && supabaseKey ? createSupabaseClient() : null;
