import { createClient } from '@supabase/supabase-js';

let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/^"|"$/g, '').replace(/'/g, '');
supabaseUrl = supabaseUrl.replace(/\/+$/, ""); // Remove trailing slashes
supabaseUrl = supabaseUrl.replace(/\/rest\/v1$/, ""); // Remove /rest/v1 if the user copied the full API URL
supabaseUrl = supabaseUrl.replace(/\/+$/, ""); // Remove trailing slashes again

if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  // Check if it's just a project ID
  if (!supabaseUrl.includes('.')) {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
  } else {
    supabaseUrl = `https://${supabaseUrl}`;
  }
}
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^"|"$/g, '').replace(/'/g, '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please add them to your environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
