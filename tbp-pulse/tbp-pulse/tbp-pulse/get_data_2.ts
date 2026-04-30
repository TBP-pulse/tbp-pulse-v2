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

async function checkData() {
  const { data: clients, error: clientsErr } = await supabase.from('clients').select('*');
  console.log('Clients:', clients?.length, clientsErr?.message || clientsErr);
}
checkData();
