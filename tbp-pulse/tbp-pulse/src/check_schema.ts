import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('projects').select('*');
  console.log("Error:", error);
  // deduplicate projects since anon key shouldn't be able to delete things, 
  // wait we don't have service role, so we can't delete directly without auth if RLS blocks delete.
  // wait, the user is authenticated in the browser. 
}
check();
