import { createClient } from '@supabase/supabase-js';

let rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
if (rawUrl.endsWith('/rest/v1/') || rawUrl.endsWith('/rest/v1')) {
  rawUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
}

const supabaseUrl = rawUrl;
const supabaseKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
