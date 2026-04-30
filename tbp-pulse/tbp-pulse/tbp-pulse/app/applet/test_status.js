import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('tasks').select('status').limit(100);
  console.log(data);
  const statuses = new Set(data?.map(d => d.status));
  console.log('Unique statuses in DB:', Array.from(statuses));
}
run();
