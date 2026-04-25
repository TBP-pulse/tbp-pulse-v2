import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('messages').insert({
    client: 'Infinity Forest',
    content: 'TEST TEST TEST',
    sender: 'U',
    sender_full: 'Test',
    created_at: new Date().toISOString()
  }).select();
  console.log("INSERT RESULT:", data, error);
}
check();
