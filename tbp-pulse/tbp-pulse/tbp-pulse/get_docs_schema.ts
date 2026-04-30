import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let supabaseUrl = process.env.VITE_SUPABASE_URL || '';
supabaseUrl = supabaseUrl.trim().replace(/^"|"$/g, '').replace(/'/g, '');
supabaseUrl = supabaseUrl.replace(/\/+$/, "");
supabaseUrl = supabaseUrl.replace(/\/rest\/v1$/, "");
supabaseUrl = supabaseUrl.replace(/\/+$/, "");
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  if (!supabaseUrl.includes('.')) {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
  } else {
    supabaseUrl = `https://${supabaseUrl}`;
  }
}
const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^"|"$/g, '').replace(/'/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('documents').select('*').limit(1);
  console.log("documents columns:", data && data.length > 0 ? Object.keys(data[0]) : "no data but:", error?.message || 'ok');
}
checkSchema();
