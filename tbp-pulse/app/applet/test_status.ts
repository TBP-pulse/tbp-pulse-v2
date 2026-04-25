import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_tasks_statuses'); // probably doesn't exist
  const { data: d } = await supabase.from('tasks').select('status').limit(100);
  const statuses = new Set(d?.map(x => x.status));
  console.log('Unique statuses in DB:', Array.from(statuses));
}
run();
